; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__(_double*_double*)" = type { double*, double* }
%"env__()" = type {}

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 2.000000e+00, double* %3
  %4 = insertvalue %"env__(_double*_double*)" zeroinitializer, double* %1, 0
  %5 = insertvalue %"env__(_double*_double*)" %4, double* %3, 1
  %6 = call i8* @_ZN2GC8allocateEj(i32 16)
  %7 = bitcast i8* %6 to %"env__(_double*_double*)"*
  store %"env__(_double*_double*)" %5, %"env__(_double*_double*)"* %7
  call void @foo(%"env__(_double*_double*)"* %7)
  %8 = call i8* @_ZN2GC8allocateEj(i32 1)
  %9 = bitcast i8* %8 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %9
  call void @fooObj(%"env__()"* %9)
  %10 = call i8* @_ZN2GC8allocateEj(i32 8)
  %11 = bitcast i8* %10 to double*
  store double 1.000000e+00, double* %11
  %12 = call i8* @_ZN2GC8allocateEj(i32 8)
  %13 = bitcast i8* %12 to double*
  store double 2.000000e+00, double* %13
  %14 = insertvalue %"env__(_double*_double*)" zeroinitializer, double* %11, 0
  %15 = insertvalue %"env__(_double*_double*)" %14, double* %13, 1
  %16 = call i8* @_ZN2GC8allocateEj(i32 16)
  %17 = bitcast i8* %16 to %"env__(_double*_double*)"*
  store %"env__(_double*_double*)" %15, %"env__(_double*_double*)"* %17
  call void @bar(%"env__(_double*_double*)"* %17)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%"env__(_double*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*_double*)", %"env__(_double*_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*_double*)" %0, 0
  %2 = extractvalue %"env__(_double*_double*)" %0, 0
  %3 = load double, double* %2
  store double %3, double* %1
  %4 = extractvalue %"env__(_double*_double*)" %0, 0
  %5 = load double, double* %4
  %6 = fsub double -0.000000e+00, %5
  store double %6, double* %4
  %7 = extractvalue %"env__(_double*_double*)" %0, 0
  %8 = load double, double* %7
  %9 = fptosi double %8 to i32
  %10 = xor i32 %9, -1
  %11 = sitofp i32 %10 to double
  %12 = extractvalue %"env__(_double*_double*)" %0, 0
  %13 = load double, double* %12
  %14 = fadd double %13, 1.000000e+00
  store double %14, double* %12
  %15 = extractvalue %"env__(_double*_double*)" %0, 0
  %16 = load double, double* %15
  %17 = fsub double %16, 1.000000e+00
  store double %17, double* %15
  %18 = extractvalue %"env__(_double*_double*)" %0, 0
  %19 = load double, double* %18
  %20 = fadd double %19, 1.000000e+00
  store double %20, double* %18
  %21 = extractvalue %"env__(_double*_double*)" %0, 0
  %22 = load double, double* %21
  %23 = fsub double %22, 1.000000e+00
  store double %23, double* %21
  ret void
}

define void @fooObj(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %2 = bitcast i8* %1 to double*
  store double 0.000000e+00, double* %2
  %3 = call i8* @_ZN2GC8allocateEj(i32 8)
  %a = bitcast i8* %3 to { double* }*
  %b = getelementptr inbounds { double* }, { double* }* %a, i32 0, i32 0
  store double* %2, double** %b
  %b1 = getelementptr inbounds { double* }, { double* }* %a, i32 0, i32 0
  %4 = load double*, double** %b1
  %5 = load double, double* %4
  %6 = fadd double %5, 1.000000e+00
  %7 = call i8* @_ZN2GC8allocateEj(i32 8)
  %8 = bitcast i8* %7 to double*
  store double %6, double* %8
  store double* %8, double** %b1
  %b2 = getelementptr inbounds { double* }, { double* }* %a, i32 0, i32 0
  %9 = load double*, double** %b2
  %10 = load double, double* %9
  %11 = fsub double %10, 1.000000e+00
  %12 = call i8* @_ZN2GC8allocateEj(i32 8)
  %13 = bitcast i8* %12 to double*
  store double %11, double* %13
  store double* %13, double** %b2
  %b3 = getelementptr inbounds { double* }, { double* }* %a, i32 0, i32 0
  %14 = load double*, double** %b3
  %15 = load double, double* %14
  %16 = fadd double %15, 1.000000e+00
  %17 = call i8* @_ZN2GC8allocateEj(i32 8)
  %18 = bitcast i8* %17 to double*
  store double %16, double* %18
  store double* %18, double** %b3
  %b4 = getelementptr inbounds { double* }, { double* }* %a, i32 0, i32 0
  %19 = load double*, double** %b4
  %20 = load double, double* %19
  %21 = fsub double %20, 1.000000e+00
  %22 = call i8* @_ZN2GC8allocateEj(i32 8)
  %23 = bitcast i8* %22 to double*
  store double %21, double* %23
  store double* %23, double** %b4
  ret void
}

define void @bar(%"env__(_double*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*_double*)", %"env__(_double*_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*_double*)" %0, 0
  %2 = extractvalue %"env__(_double*_double*)" %0, 1
  %3 = load double, double* %1
  %4 = load double, double* %2
  %5 = fadd double %3, %4
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %7 = bitcast i8* %6 to double*
  store double %5, double* %7
  %8 = extractvalue %"env__(_double*_double*)" %0, 0
  %9 = extractvalue %"env__(_double*_double*)" %0, 1
  %10 = load double, double* %8
  %11 = load double, double* %9
  %12 = fsub double %10, %11
  %13 = extractvalue %"env__(_double*_double*)" %0, 0
  %14 = extractvalue %"env__(_double*_double*)" %0, 1
  %15 = load double, double* %13
  %16 = load double, double* %14
  %17 = fmul double %15, %16
  %18 = extractvalue %"env__(_double*_double*)" %0, 0
  %19 = extractvalue %"env__(_double*_double*)" %0, 1
  %20 = load double, double* %18
  %21 = load double, double* %19
  %22 = fdiv double %20, %21
  %23 = extractvalue %"env__(_double*_double*)" %0, 0
  %24 = extractvalue %"env__(_double*_double*)" %0, 1
  %25 = load double, double* %23
  %26 = load double, double* %24
  %27 = frem double %25, %26
  %28 = extractvalue %"env__(_double*_double*)" %0, 0
  %29 = load double, double* %28
  %30 = extractvalue %"env__(_double*_double*)" %0, 1
  %31 = load double, double* %30
  %32 = fptosi double %29 to i32
  %33 = fptosi double %31 to i32
  %34 = and i32 %32, %33
  %35 = sitofp i32 %34 to double
  %36 = extractvalue %"env__(_double*_double*)" %0, 0
  %37 = load double, double* %36
  %38 = extractvalue %"env__(_double*_double*)" %0, 1
  %39 = load double, double* %38
  %40 = fptosi double %37 to i32
  %41 = fptosi double %39 to i32
  %42 = or i32 %40, %41
  %43 = sitofp i32 %42 to double
  %44 = extractvalue %"env__(_double*_double*)" %0, 0
  %45 = load double, double* %44
  %46 = extractvalue %"env__(_double*_double*)" %0, 1
  %47 = load double, double* %46
  %48 = fptosi double %45 to i32
  %49 = fptosi double %47 to i32
  %50 = xor i32 %48, %49
  %51 = sitofp i32 %50 to double
  %52 = extractvalue %"env__(_double*_double*)" %0, 0
  %53 = load double, double* %52
  %54 = extractvalue %"env__(_double*_double*)" %0, 1
  %55 = load double, double* %54
  %56 = fptosi double %53 to i32
  %57 = fptosi double %55 to i32
  %58 = shl i32 %56, %57
  %59 = sitofp i32 %58 to double
  %60 = extractvalue %"env__(_double*_double*)" %0, 0
  %61 = load double, double* %60
  %62 = extractvalue %"env__(_double*_double*)" %0, 1
  %63 = load double, double* %62
  %64 = fptosi double %61 to i32
  %65 = fptosi double %63 to i32
  %66 = ashr i32 %64, %65
  %67 = sitofp i32 %66 to double
  %68 = extractvalue %"env__(_double*_double*)" %0, 0
  %69 = load double, double* %68
  %70 = extractvalue %"env__(_double*_double*)" %0, 1
  %71 = load double, double* %70
  %72 = fptosi double %69 to i32
  %73 = fptosi double %71 to i32
  %74 = lshr i32 %72, %73
  %75 = sitofp i32 %74 to double
  %76 = extractvalue %"env__(_double*_double*)" %0, 0
  %77 = extractvalue %"env__(_double*_double*)" %0, 1
  %78 = load double, double* %77
  %79 = load double, double* %76
  %80 = fadd double %79, %78
  store double %80, double* %76
  %81 = extractvalue %"env__(_double*_double*)" %0, 0
  %82 = extractvalue %"env__(_double*_double*)" %0, 1
  %83 = load double, double* %82
  %84 = load double, double* %81
  %85 = fsub double %84, %83
  store double %85, double* %81
  %86 = extractvalue %"env__(_double*_double*)" %0, 0
  %87 = extractvalue %"env__(_double*_double*)" %0, 1
  %88 = load double, double* %87
  %89 = load double, double* %86
  %90 = fmul double %89, %88
  store double %90, double* %86
  %91 = extractvalue %"env__(_double*_double*)" %0, 0
  %92 = extractvalue %"env__(_double*_double*)" %0, 1
  %93 = load double, double* %92
  %94 = load double, double* %91
  %95 = fdiv double %94, %93
  store double %95, double* %91
  %96 = extractvalue %"env__(_double*_double*)" %0, 0
  %97 = extractvalue %"env__(_double*_double*)" %0, 1
  %98 = load double, double* %97
  %99 = load double, double* %96
  %100 = frem double %99, %98
  store double %100, double* %96
  %101 = extractvalue %"env__(_double*_double*)" %0, 0
  %102 = extractvalue %"env__(_double*_double*)" %0, 1
  %103 = load double, double* %102
  %104 = load double, double* %101
  %105 = fptosi double %104 to i32
  %106 = fptosi double %103 to i32
  %107 = and i32 %105, %106
  %108 = sitofp i32 %107 to double
  store double %108, double* %101
  %109 = extractvalue %"env__(_double*_double*)" %0, 0
  %110 = extractvalue %"env__(_double*_double*)" %0, 1
  %111 = load double, double* %110
  %112 = load double, double* %109
  %113 = fptosi double %112 to i32
  %114 = fptosi double %111 to i32
  %115 = or i32 %113, %114
  %116 = sitofp i32 %115 to double
  store double %116, double* %109
  %117 = extractvalue %"env__(_double*_double*)" %0, 0
  %118 = extractvalue %"env__(_double*_double*)" %0, 1
  %119 = load double, double* %118
  %120 = load double, double* %117
  %121 = fptosi double %120 to i32
  %122 = fptosi double %119 to i32
  %123 = xor i32 %121, %122
  %124 = sitofp i32 %123 to double
  store double %124, double* %117
  %125 = extractvalue %"env__(_double*_double*)" %0, 0
  %126 = extractvalue %"env__(_double*_double*)" %0, 1
  %127 = load double, double* %126
  %128 = load double, double* %125
  %129 = fptosi double %128 to i32
  %130 = fptosi double %127 to i32
  %131 = shl i32 %129, %130
  %132 = sitofp i32 %131 to double
  store double %132, double* %125
  %133 = extractvalue %"env__(_double*_double*)" %0, 0
  %134 = extractvalue %"env__(_double*_double*)" %0, 1
  %135 = load double, double* %134
  %136 = load double, double* %133
  %137 = fptosi double %136 to i32
  %138 = fptosi double %135 to i32
  %139 = ashr i32 %137, %138
  %140 = sitofp i32 %139 to double
  store double %140, double* %133
  %141 = extractvalue %"env__(_double*_double*)" %0, 0
  %142 = extractvalue %"env__(_double*_double*)" %0, 1
  %143 = load double, double* %142
  %144 = load double, double* %141
  %145 = fptosi double %144 to i32
  %146 = fptosi double %143 to i32
  %147 = lshr i32 %145, %146
  %148 = sitofp i32 %147 to double
  store double %148, double* %141
  ret void
}
