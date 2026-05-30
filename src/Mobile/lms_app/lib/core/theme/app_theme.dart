import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        background: AppColors.background,
        surface: AppColors.surface,
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: AppColors.background,
      
      // Tối ưu Typography cho màn hình PDA (dễ đọc)
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        displayMedium: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        bodyLarge: TextStyle(fontSize: 18, color: AppColors.textPrimary), // Chữ to hơn bình thường
        bodyMedium: TextStyle(fontSize: 16, color: AppColors.textSecondary),
      ),
      
      // Tối ưu ElevatedButton (Nút bấm to để dễ bấm khi dùng găng tay)
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56), // Chiều cao tối thiểu 56px
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      
      // Tối ưu InputDecoration (Ô nhập liệu to)
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }
}
