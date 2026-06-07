import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/error/error_handler.dart';
import '../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../qr/domain/qr_models.dart';
import '../providers/inventory_provider.dart';

class WarehouseLayoutScreen extends ConsumerStatefulWidget {
  final String? preSearchedSku;
  const WarehouseLayoutScreen({super.key, this.preSearchedSku});

  @override
  ConsumerState<WarehouseLayoutScreen> createState() => _WarehouseLayoutScreenState();
}

class _WarehouseLayoutScreenState extends ConsumerState<WarehouseLayoutScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  // Dãy kệ hiện tại đang chọn (A, B, C, D, E)
  String _selectedAisle = 'A';
  
  // Trạng thái tìm kiếm SKU
  String _searchedSku = '';
  List<String> _highlightedBins = [];
  Map<String, int> _skuQuantitiesInBins = {};
  bool _isSearching = false;
  
  // Gợi ý ô kệ trống
  bool _showEmptySuggestions = false;
  List<String> _suggestedEmptyBins = [];

  // Danh sách bins và trạng thái lấp đầy thật sự nạp từ API
  final Map<String, String> _realBinStates = {};
  final List<Map<String, dynamic>> _allRealBins = [];
  final List<String> _availableAisles = [];

  @override
  void initState() {
    super.initState();
    if (widget.preSearchedSku != null && widget.preSearchedSku!.isNotEmpty) {
      _searchController.text = widget.preSearchedSku!;
      Future.microtask(() => _handleSearch(widget.preSearchedSku!));
    }
  }

  // Xử lý nạp và lọc dữ liệu từ API Hierarchy
  String _normalizeCoordinate(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return trimmed;
    if (RegExp(r'^\d+$').hasMatch(trimmed)) {
      return trimmed.padLeft(2, '0');
    }
    return trimmed.toUpperCase();
  }

  void _parseWarehouseHierarchy(Map<String, dynamic> data) {
    _realBinStates.clear();
    _allRealBins.clear();
    _availableAisles.clear();

    // Hỗ trợ cả key chữ thường và chữ hoa từ API
    final blocks = data['blocks'] as List<dynamic>? ?? data['Blocks'] as List<dynamic>? ?? [];
    for (var block in blocks) {
      final zones = block['zones'] as List<dynamic>? ?? block['Zones'] as List<dynamic>? ?? [];
      for (var zone in zones) {
        final bins = zone['bins'] as List<dynamic>? ?? zone['Bins'] as List<dynamic>? ?? [];
        for (var bin in bins) {
          final binCode = (bin['binCode'] as String? ?? bin['BinCode'] as String? ?? '').trim();
          final status = bin['status']?.toString() ?? bin['Status']?.toString() ?? 'AVAILABLE';
          
          String aisle = (bin['aisle']?.toString() ?? bin['Aisle']?.toString() ?? '').trim();
          String rack = (bin['rack']?.toString() ?? bin['Rack']?.toString() ?? '').trim();
          String shelf = (bin['shelf']?.toString() ?? bin['Shelf']?.toString() ?? '').trim();

          // Bộ phân tách dự phòng thông minh dùng Regex & Tách chuỗi: Parse từ BinCode nếu các cột bị rỗng
          if (aisle.isEmpty || rack.isEmpty || shelf.isEmpty) {
            String code = binCode;
            if (code.toUpperCase().startsWith('BIN-')) {
              code = code.substring(4);
            }
            
            final parts = code.split('-');
            if (parts.length >= 3) {
              if (shelf.isEmpty) shelf = parts[parts.length - 1];
              if (rack.isEmpty) rack = parts[parts.length - 2];
              if (aisle.isEmpty) aisle = parts.sublist(0, parts.length - 2).join('-');
            } else if (parts.length == 2) {
              final firstPart = parts[0];
              final secondPart = parts[1];
              
              final regex = RegExp(r'^([A-Za-z]+)(\d+)$');
              final match = regex.firstMatch(firstPart);
              if (match != null) {
                if (aisle.isEmpty) aisle = match.group(1) ?? '';
                if (rack.isEmpty) rack = match.group(2) ?? '';
                if (shelf.isEmpty) shelf = secondPart;
              }
            }
          }

          aisle = aisle.toUpperCase().trim();
          rack = rack.trim();
          shelf = shelf.trim();
          if (binCode.isNotEmpty) {
            final normalizedBinCode = binCode.toUpperCase().trim();
            final Map<String, dynamic> binInfo = {
              'id': bin['id'] ?? bin['Id'],
              'binCode': normalizedBinCode,
              'status': status.toUpperCase(),
              'aisle': aisle.toUpperCase(),
              'rack': _normalizeCoordinate(rack),
              'shelf': _normalizeCoordinate(shelf),
            };
            
            _allRealBins.add(binInfo);
            _realBinStates[normalizedBinCode] = status.toUpperCase();
            
            if (aisle.isNotEmpty && !_availableAisles.contains(aisle.toUpperCase())) {
              _availableAisles.add(aisle.toUpperCase());
            }
          }
        }
      }
    }
    
    _availableAisles.sort();
    
    // Nếu chưa chọn dãy, mặc định chọn dãy đầu tiên trong kho thật
    if (_availableAisles.isNotEmpty && !_availableAisles.contains(_selectedAisle)) {
      _selectedAisle = _availableAisles.first;
    }
  }

  // Xử lý tìm kiếm SKU để định vị vị trí thật
  Future<void> _handleSearch(String skuCode) async {
    if (skuCode.isEmpty) return;
    
    setState(() {
      _isSearching = true;
      _searchedSku = skuCode;
      _highlightedBins = [];
      _skuQuantitiesInBins = {};
      _showEmptySuggestions = false;
    });

    try {
      final lookupService = ref.read(qrLookupServiceProvider);
      // Gọi API tra cứu SKU thật
      final skuData = await lookupService.lookupSku(skuCode: skuCode);
      final bins = skuData['bins'] as List<dynamic>? ?? skuData['Bins'] as List<dynamic>? ?? [];
      
      final List<String> foundBins = [];
      final Map<String, int> qtyMap = {};
      
      for (var bin in bins) {
        final code = (bin['binCode'] as String? ?? bin['BinCode'] as String? ?? '').trim();
        final qty = bin['quantityOnHand'] as int? ?? bin['QuantityOnHand'] as int? ?? 0;
        if (code.isNotEmpty) {
          foundBins.add(code.toUpperCase());
          qtyMap[code.toUpperCase()] = qty;
        }
      }

      setState(() {
        _highlightedBins = foundBins;
        _skuQuantitiesInBins = qtyMap;
        _isSearching = false;
      });

      if (foundBins.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('⚠️ Không tìm thấy tồn kho cho SKU "$skuCode" trong hệ thống.'),
          backgroundColor: AppColors.warning,
        ));
      } else {
        // Tự động chuyển đến dãy kệ chứa bin đầu tiên tìm thấy
        final firstBin = foundBins.first;
        
        // Tra cứu trực tiếp thông tin bin trong danh sách cấu trúc thực tế của kho
        final matchedBinInfo = _allRealBins.firstWhere(
          (b) => b['binCode'].toString().toUpperCase() == firstBin.toUpperCase(),
          orElse: () => <String, dynamic>{},
        );
        
        if (matchedBinInfo.isNotEmpty) {
          final aisle = matchedBinInfo['aisle'] as String;
          if (_availableAisles.contains(aisle)) {
            setState(() {
              _selectedAisle = aisle;
            });
          }
        }
        
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('✅ Đã định vị SKU "$skuCode" tại ${foundBins.length} vị trí ô kệ!'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      setState(() => _isSearching = false);
      ErrorHandler.showError(context, e);
    }
  }

  // Quét SKU bằng Camera
  Future<void> _scanSku() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      _searchController.text = result;
      _handleSearch(result.trim());
    }
  }

  // Gợi ý ô kệ trống để cất hàng tại dãy đang chọn
  void _suggestEmptyBinsAction() {
    final List<String> emptyBins = [];
    for (var bin in _allRealBins) {
      // AVAILABLE ở database thật nghĩa là ô kệ còn trống
      if (bin['aisle'] == _selectedAisle && (bin['status'] == 'AVAILABLE' || bin['status'] == 'EMPTY')) {
        emptyBins.add(bin['binCode']);
      }
    }
    
    emptyBins.sort();
    final suggestions = emptyBins.take(5).toList();

    setState(() {
      _showEmptySuggestions = true;
      _suggestedEmptyBins = suggestions;
    });

    if (suggestions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Dãy hiện tại không còn ô kệ nào trống hoàn toàn.'),
        backgroundColor: AppColors.warning,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('💡 Đề xuất ${suggestions.length} ô kệ trống tại Dãy $_selectedAisle!'),
        backgroundColor: AppColors.primary,
      ));
    }
  }

  // Reset tìm kiếm
  void _resetSearch() {
    setState(() {
      _searchController.clear();
      _searchedSku = '';
      _highlightedBins = [];
      _skuQuantitiesInBins = {};
      _showEmptySuggestions = false;
      _suggestedEmptyBins = [];
    });
  }

  // Hiển thị Bottom Sheet chi tiết ô kệ khi click vào
  void _showBinDetails(String binId, String binCode) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return _BinDetailBottomSheet(binId: binId, binCode: binCode);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final hierarchyAsync = ref.watch(warehouseHierarchyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sơ đồ & Cấu trúc kho'),
        actions: [
          if (_searchedSku.isNotEmpty || _showEmptySuggestions)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _resetSearch,
              tooltip: 'Reset sơ đồ',
            ),
        ],
      ),
      floatingActionButton: _searchedSku.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: _resetSearch,
              icon: const Icon(Icons.clear),
              label: const Text('Tắt định vị SKU'),
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            )
          : null,
      body: hierarchyAsync.when(
        data: (hierarchyData) {
          if (hierarchyData.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'Không có dữ liệu cấu trúc kho.\nVui lòng thiết lập cấu trúc kho hoặc chọn kho khác.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            );
          }

          // Nạp dữ liệu cấu trúc thực tế từ API
          _parseWarehouseHierarchy(hierarchyData);

          final aislesToUse = _availableAisles.isNotEmpty ? _availableAisles : ['A', 'B', 'C', 'D', 'E'];

          return Column(
            children: [
              // 1. Thanh tìm kiếm SKU & Quét mã
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            )
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: 'Nhập mã SKU để định vị...',
                            prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                            suffixIcon: _searchController.text.isNotEmpty || _searchedSku.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear),
                                    onPressed: () {
                                      _searchController.clear();
                                      _resetSearch();
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onSubmitted: (value) {
                            _handleSearch(value.trim());
                          },
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      onPressed: _scanSku,
                      icon: const Icon(Icons.camera_alt),
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.all(12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Bộ lọc chọn Dãy Kệ (Aisles) từ API thật
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: Row(
                  children: aislesToUse.map((aisle) {
                    final isSelected = _selectedAisle == aisle;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(
                          'Dãy $aisle',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedAisle = aisle;
                            });
                          }
                        },
                        selectedColor: AppColors.primary,
                        backgroundColor: Colors.grey.shade200,
                        checkmarkColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    );
                  }).toList(),
                ),
              ),

              // Hiển thị trạng thái đang tìm kiếm
              if (_isSearching)
                const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: LinearProgressIndicator(minHeight: 2),
                ),

              // Chú thích màu sắc
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildLegendItem(Colors.grey.shade300, 'Trống (Sẵn sàng)'),
                    _buildLegendItem(AppColors.primary.withOpacity(0.25), 'Có hàng'),
                    _buildLegendItem(Colors.amber.withOpacity(0.35), 'Đầy'),
                    _buildLegendItem(Colors.green.shade600, 'Chứa SKU'),
                  ],
                ),
              ),

              // 3. Sơ đồ ma trận kệ lưới 2D (Rack & Shelf Grid)
              Expanded(
                child: Container(
                  margin: const EdgeInsets.all(12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: _buildGridMap(),
                ),
              ),

              // 4. Panel gợi ý dưới cùng
              _buildQuickActionPanel(),
            ],
          );
        },
        loading: () => const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang tải sơ đồ thiết lập kho...'),
            ],
          ),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Không thể tải sơ đồ cấu trúc kho:\n$err',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.error),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(warehouseHierarchyProvider),
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, {bool isBorder = false}) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: isBorder ? Border.all(color: Colors.green, width: 2) : null,
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
      ],
    );
  }

  bool _coordinateMatch(String? a, String? b) {
    if (a == null || b == null) return false;
    final cleanA = a.trim().toUpperCase();
    final cleanB = b.trim().toUpperCase();
    if (cleanA == cleanB) return true;
    
    final intA = int.tryParse(cleanA);
    final intB = int.tryParse(cleanB);
    if (intA != null && intB != null && intA == intB) {
      return true;
    }
    return false;
  }

  Widget _buildGridMap() {
    // Tìm các Rack và Shelf thực tế có trong dãy đang chọn để vẽ lưới động
    final aisleBins = _allRealBins.where((b) => b['aisle'] == _selectedAisle).toList();
    
    final List<String> rackList = [];
    final List<String> shelfList = [];
    
    for (var bin in aisleBins) {
      final r = bin['rack'] as String? ?? '01';
      final s = bin['shelf'] as String? ?? '01';
      if (!rackList.contains(r)) rackList.add(r);
      if (!shelfList.contains(s)) shelfList.add(s);
    }
    
    rackList.sort();
    shelfList.sort();
    
    // Fallback nếu không nạp được
    if (rackList.isEmpty) rackList.addAll(['01', '02', '03', '04', '05', '06']);
    if (shelfList.isEmpty) shelfList.addAll(['01', '02', '03', '04']);

    final reversedShelves = shelfList.reversed.toList();

    return Column(
      children: [
        // Header hiển thị mã Rack (Cột dọc)
        Row(
          children: [
            const SizedBox(width: 60), // Cột tiêu đề Tầng (tăng độ rộng lên 60 tránh rớt dòng)
            ...rackList.map((rackStr) {
              return Expanded(
                child: Center(
                  child: Text(
                    'Kệ $rackStr',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.textSecondary),
                  ),
                ),
              );
            }),
          ],
        ),
        const SizedBox(height: 8),

        // Thân sơ đồ kệ: các tầng (sử dụng SingleChildScrollView để hỗ trợ cuộn khi có nhiều tầng như dãy wall, tránh chen chúc)
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: reversedShelves.map((shelfStr) {
                // Bỏ số 0 ở đầu nhãn tầng để hiển thị gọn gàng (Tầng 1, Tầng 2, ..., Tầng 10)
                final displayShelf = int.tryParse(shelfStr)?.toString() ?? shelfStr;

                return Container(
                  height: 56, // Chiều cao cố định thoải mái cho mỗi tầng trên màn hình PDA
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      // Nhãn tầng ở đầu hàng (tăng độ rộng lên 60 để không bị rớt dòng Tầng 10)
                      SizedBox(
                        width: 60,
                        child: Text(
                          'Tầng $displayShelf',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ),
                      
                      // Các ô kệ (1 ô kệ duy nhất trên mỗi giao điểm Rack-Shelf)
                      ...rackList.map((rackStr) {
                        // Tìm ô kệ thực tế tương ứng từ danh sách nạp từ API (sử dụng _coordinateMatch thông minh)
                        final matchBin = _allRealBins.firstWhere(
                          (b) => b['aisle'] == _selectedAisle && 
                                 _coordinateMatch(b['rack'], rackStr) && 
                                 _coordinateMatch(b['shelf'], shelfStr),
                          orElse: () => <String, dynamic>{},
                        );

                        if (matchBin.isEmpty) {
                          return const Expanded(
                            child: SizedBox.shrink(),
                          );
                        }

                        final binId = matchBin['id'] as String;
                        final binCode = matchBin['binCode'] as String;

                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(4.0),
                            child: _buildBinWidget(binId, binCode, rackStr, shelfStr),
                          ),
                        );
                      }),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBinWidget(String binId, String binCode, String rack, String shelf) {
    final normalizedCode = binCode.toUpperCase().trim();
    final isHighlighted = _highlightedBins.contains(normalizedCode);
    final skuQty = _skuQuantitiesInBins[normalizedCode];
    final isSuggestedEmpty = _showEmptySuggestions && _suggestedEmptyBins.contains(normalizedCode);

    // Trạng thái lấp đầy thật sự nạp từ API (AVAILABLE/OCCUPIED/FULL)
    final fillState = _realBinStates[normalizedCode] ?? 'EMPTY';

    Color bgColor = Colors.grey.shade200;
    Color textColor = AppColors.textPrimary;
    
    // Mapped theo DB thật: AVAILABLE = có sẵn (empty), OCCUPIED = có hàng
    if (fillState == 'AVAILABLE' || fillState == 'EMPTY') {
      bgColor = Colors.grey.shade100;
    } else if (fillState == 'OCCUPIED') {
      bgColor = AppColors.primary.withOpacity(0.12);
    } else if (fillState == 'FULL') {
      bgColor = Colors.amber.withOpacity(0.18);
    }

    if (isHighlighted) {
      bgColor = Colors.green.shade600; // Xanh lá cây đậm nổi bật
      textColor = Colors.white;       // Chữ màu trắng dễ đọc trên nền xanh
    } else if (isSuggestedEmpty) {
      bgColor = Colors.blue.shade100;
    }

    // Hiển thị nhãn vị trí gọn gàng, ví dụ: "01-02"
    final labelText = '$rack-$shelf';

    return InkWell(
      onTap: () => _showBinDetails(binId, binCode),
      borderRadius: BorderRadius.circular(6),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(6),
          border: isHighlighted
              ? Border.all(color: Colors.green.shade800, width: 2.5)
              : isSuggestedEmpty
                  ? Border.all(color: AppColors.primary, width: 2.5)
                  : Border.all(color: Colors.grey.shade300, width: 0.8),
          boxShadow: isHighlighted
              ? [BoxShadow(color: Colors.green.withOpacity(0.4), blurRadius: 6, spreadRadius: 1)]
              : null,
        ),
        alignment: Alignment.center,
        child: isHighlighted
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.pin_drop, size: 10, color: Colors.white),
                      const SizedBox(width: 2),
                      Text(
                        labelText,
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  if (skuQty != null)
                    Text(
                      'SL: $skuQty',
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                ],
              )
            : Text(
                labelText,
                style: TextStyle(
                  fontSize: 10, 
                  color: isSuggestedEmpty ? AppColors.primary : textColor.withOpacity(0.8),
                  fontWeight: isSuggestedEmpty ? FontWeight.bold : FontWeight.normal
                ),
              ),
      ),
    );
  }

  Widget _buildQuickActionPanel() {
    if (_searchedSku.isNotEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        color: AppColors.success.withOpacity(0.08),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.success),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Đang tìm: $_searchedSku\nTìm thấy ở ${_highlightedBins.length} ô kệ.',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
              ),
            ),
            ElevatedButton(
              onPressed: _resetSearch,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, foregroundColor: Colors.white),
              child: const Text('Hủy lọc'),
            ),
          ],
        ),
      );
    }

    if (_showEmptySuggestions) {
      return Container(
        padding: const EdgeInsets.all(16),
        color: AppColors.primary.withOpacity(0.08),
        child: Row(
          children: [
            const Icon(Icons.lightbulb_outline, color: AppColors.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Đề xuất ô trống cất hàng:',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13),
                  ),
                  Text(
                    _suggestedEmptyBins.join(', '),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () => setState(() => _showEmptySuggestions = false),
              child: const Text('Ẩn gợi ý'),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Center(
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: _suggestEmptyBinsAction,
            icon: const Icon(Icons.grid_view_sharp, size: 20),
            label: const Text('Tìm ô kệ trống trong dãy'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ),
      ),
    );
  }
}

// Bottom Sheet chi tiết ô kệ
class _BinDetailBottomSheet extends ConsumerStatefulWidget {
  final String binId;
  final String binCode;
  const _BinDetailBottomSheet({required this.binId, required this.binCode});

  @override
  ConsumerState<_BinDetailBottomSheet> createState() => _BinDetailBottomSheetState();
}

class _BinDetailBottomSheetState extends ConsumerState<_BinDetailBottomSheet> {
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _items = [];
  String _zoneName = 'Khu lưu trữ chính';
  String _status = 'Hoạt động';

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      final lookupService = ref.read(qrLookupServiceProvider);
      // Gọi API tra cứu thông tin Bin thật bằng GUID
      final data = await lookupService.lookupBin(binId: widget.binId);
      
      setState(() {
        _items = data['items'] as List<dynamic>? ?? [];
        _zoneName = data['zoneName'] ?? data['zoneType'] ?? 'Khu lưu trữ chính';
        _status = data['status'] ?? 'Hoạt động';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final double maxHeight = MediaQuery.of(context).size.height * 0.75;
    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        top: 20,
        left: 20,
        right: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 50,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Chi tiết Ô Kệ: ${widget.binCode}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _status,
                  style: TextStyle(color: Colors.green.shade800, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Khu vực: $_zoneName',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const Divider(height: 20),
 
          Flexible(
            child: _isLoading
                ? const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                            'Không thể lấy dữ liệu tồn kho: $_errorMessage',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                      )
                    : _items.isEmpty
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(24.0),
                              child: Text(
                                'Ô kệ này hiện đang trống.',
                                style: TextStyle(fontStyle: FontStyle.italic, color: AppColors.textSecondary),
                              ),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            itemCount: _items.length,
                            itemBuilder: (context, index) {
                              final item = _items[index];
                              final sku = item['skuCode'] ?? item['sku'] ?? 'N/A';
                              final qty = item['quantityOnHand'] ?? item['quantity'] ?? 0;
                              final available = item['availableQty'] ?? qty;
                              final lotNo = item['lotNo'] ?? 'N/A';
 
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                child: ListTile(
                                  leading: const CircleAvatar(child: Icon(Icons.category, size: 20)),
                                  title: Text(sku, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text('Lô: $lotNo'),
                                  trailing: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '$qty PCS',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                                      ),
                                      if (available != qty)
                                        Text(
                                          'Sẵn có: $available',
                                          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                                        )
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
          const Divider(height: 20),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    context.push('/wms/count?binCode=${widget.binCode}');
                  },
                  icon: const Icon(Icons.fact_check),
                  label: const Text('Kiểm kê ô kệ'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    context.push('/wms/putaway');
                  },
                  icon: const Icon(Icons.move_to_inbox),
                  label: const Text('Cất hàng vào đây'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
