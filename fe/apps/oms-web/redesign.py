import sys

file_path = r'd:\Logistics\fe\apps\oms-web\app\(portal)\orders\create\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Enhance overall page container
content = content.replace(
    '<div className="space-y-6 max-w-4xl mx-auto">',
    '<div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">'
)

# Enhance Header
content = content.replace(
    '''      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo đơn hàng mới</h1>
        <p className="text-muted-foreground">Điền đầy đủ thông tin để tạo đơn gửi hàng</p>
      </div>''',
    '''      <div className="bg-gradient-to-r from-indigo-50 via-white to-white dark:from-indigo-950/20 dark:via-background dark:to-background p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400">Tạo đơn hàng mới</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Điền đầy đủ thông tin để khởi tạo lộ trình vận đơn hoàn hảo</p>
        </div>
        <div className="hidden sm:flex size-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center shadow-inner border border-indigo-200 dark:border-indigo-800">
          <Package className="size-7 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>'''
)

# Enhance Main Card
content = content.replace(
    '''      <Card className="shadow-sm">
        <CardContent className="pt-6">''',
    '''      <Card className="shadow-lg border-indigo-100 dark:border-indigo-900/30 overflow-hidden rounded-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
        <CardContent className="pt-8 px-6 sm:px-10">'''
)

# Enhance Review Step Cards (this occurs multiple times, so we use string replace carefully)
content = content.replace(
    '''        <Card className="shadow-sm">
          <CardHeader className="pb-3">''',
    '''        <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/50">'''
)

content = content.replace(
    '''      <Card className="shadow-sm">
        <CardHeader className="pb-3">''',
    '''      <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow mt-4">
        <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/50">'''
)

# Enhance Navigation Buttons
content = content.replace(
    '''                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5"
                  >''',
    '''                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg px-6"
                  >'''
)

content = content.replace(
    '''                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-1.5"
                >''',
    '''                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-1.5 rounded-lg px-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >'''
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Redesign applied successfully.')
