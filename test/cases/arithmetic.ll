; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env__double___double_ = type { double*, double* }
%env = type {}

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 2.000000e+00, double* %3
  %a = insertvalue %env__double___double_ zeroinitializer, double* %1, 0
  %b = insertvalue %env__double___double_ %a, double* %3, 1
  %4 = call i8* @_ZN2GC8allocateEj(i32 16)
  %5 = bitcast i8* %4 to %env__double___double_*
  store %env__double___double_ %b, %env__double___double_* %5
  call void @foo(%env__double___double_* %5, double 1.000000e+00, double 2.000000e+00)
  %6 = call i8* @_ZN2GC8allocateEj(i32 1)
  %7 = bitcast i8* %6 to %env*
  store %env zeroinitializer, %env* %7
  call void @fooObj(%env* %7)
  %8 = call i8* @_ZN2GC8allocateEj(i32 8)
  %9 = bitcast i8* %8 to double*
  store double 1.000000e+00, double* %9
  %10 = call i8* @_ZN2GC8allocateEj(i32 8)
  %11 = bitcast i8* %10 to double*
  store double 2.000000e+00, double* %11
  %a1 = insertvalue %env__double___double_ zeroinitializer, double* %9, 0
  %b2 = insertvalue %env__double___double_ %a1, double* %11, 1
  %12 = call i8* @_ZN2GC8allocateEj(i32 16)
  %13 = bitcast i8* %12 to %env__double___double_*
  store %env__double___double_ %b2, %env__double___double_* %13
  call void @bar(%env__double___double_* %13, double 1.000000e+00, double 2.000000e+00)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%env__double___double_* %__environment__, double %a, double %b) {
entry:
  %a.alloca = alloca double
  %0 = load %env__double___double_, %env__double___double_* %__environment__
  %1 = extractvalue %env__double___double_ %0, 0
  store double %a, double* %1
  %2 = fsub double -0.000000e+00, %a
  %3 = fptosi double %a to i32
  %4 = xor i32 %3, -1
  %5 = sitofp i32 %4 to double
  %6 = fadd double %a, 1.000000e+00
  store double %6, double* %a.alloca
  %a.alloca.load = load double, double* %a.alloca
  %7 = fsub double %a.alloca.load, 1.000000e+00
  store double %7, double* %a.alloca
  %a.alloca.load1 = load double, double* %a.alloca
  %8 = fadd double %a.alloca.load1, 1.000000e+00
  store double %8, double* %a.alloca
  %a.alloca.load2 = load double, double* %a.alloca
  %9 = fsub double %a.alloca.load2, 1.000000e+00
  store double %9, double* %a.alloca
  ret void
}

define void @fooObj(%env* %__environment__) {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %a = bitcast i8* %0 to { double }*
  %b = getelementptr inbounds { double }, { double }* %a, i32 0, i32 0
  store double 0.000000e+00, double* %b
  %b1 = getelementptr inbounds { double }, { double }* %a, i32 0, i32 0
  %b1.load = load double, double* %b1
  %1 = fadd double %b1.load, 1.000000e+00
  store double %1, double* %b1
  %b2 = getelementptr inbounds { double }, { double }* %a, i32 0, i32 0
  %b2.load = load double, double* %b2
  %2 = fsub double %b2.load, 1.000000e+00
  store double %2, double* %b2
  %b3 = getelementptr inbounds { double }, { double }* %a, i32 0, i32 0
  %b3.load = load double, double* %b3
  %3 = fadd double %b3.load, 1.000000e+00
  store double %3, double* %b3
  %b4 = getelementptr inbounds { double }, { double }* %a, i32 0, i32 0
  %b4.load = load double, double* %b4
  %4 = fsub double %b4.load, 1.000000e+00
  store double %4, double* %b4
  ret void
}

define void @bar(%env__double___double_* %__environment__, double %a, double %b) {
entry:
  %0 = load %env__double___double_, %env__double___double_* %__environment__
  %1 = extractvalue %env__double___double_ %0, 0
  %.load = load double, double* %1
  %2 = load %env__double___double_, %env__double___double_* %__environment__
  %3 = extractvalue %env__double___double_ %2, 1
  %.load1 = load double, double* %3
  %4 = fadd double %.load, %.load1
  %5 = load %env__double___double_, %env__double___double_* %__environment__
  %6 = extractvalue %env__double___double_ %5, 0
  %.load2 = load double, double* %6
  %7 = load %env__double___double_, %env__double___double_* %__environment__
  %8 = extractvalue %env__double___double_ %7, 1
  %.load3 = load double, double* %8
  %9 = fsub double %.load2, %.load3
  %10 = load %env__double___double_, %env__double___double_* %__environment__
  %11 = extractvalue %env__double___double_ %10, 0
  %.load4 = load double, double* %11
  %12 = load %env__double___double_, %env__double___double_* %__environment__
  %13 = extractvalue %env__double___double_ %12, 1
  %.load5 = load double, double* %13
  %14 = fmul double %.load4, %.load5
  %15 = load %env__double___double_, %env__double___double_* %__environment__
  %16 = extractvalue %env__double___double_ %15, 0
  %.load6 = load double, double* %16
  %17 = load %env__double___double_, %env__double___double_* %__environment__
  %18 = extractvalue %env__double___double_ %17, 1
  %.load7 = load double, double* %18
  %19 = fdiv double %.load6, %.load7
  %20 = load %env__double___double_, %env__double___double_* %__environment__
  %21 = extractvalue %env__double___double_ %20, 0
  %.load8 = load double, double* %21
  %22 = load %env__double___double_, %env__double___double_* %__environment__
  %23 = extractvalue %env__double___double_ %22, 1
  %.load9 = load double, double* %23
  %24 = frem double %.load8, %.load9
  %25 = load %env__double___double_, %env__double___double_* %__environment__
  %26 = extractvalue %env__double___double_ %25, 0
  %.load10 = load double, double* %26
  %27 = load %env__double___double_, %env__double___double_* %__environment__
  %28 = extractvalue %env__double___double_ %27, 1
  %.load11 = load double, double* %28
  %29 = fptosi double %.load10 to i32
  %30 = fptosi double %.load11 to i32
  %31 = and i32 %29, %30
  %32 = sitofp i32 %31 to double
  %33 = load %env__double___double_, %env__double___double_* %__environment__
  %34 = extractvalue %env__double___double_ %33, 0
  %.load12 = load double, double* %34
  %35 = load %env__double___double_, %env__double___double_* %__environment__
  %36 = extractvalue %env__double___double_ %35, 1
  %.load13 = load double, double* %36
  %37 = fptosi double %.load12 to i32
  %38 = fptosi double %.load13 to i32
  %39 = or i32 %37, %38
  %40 = sitofp i32 %39 to double
  %41 = load %env__double___double_, %env__double___double_* %__environment__
  %42 = extractvalue %env__double___double_ %41, 0
  %.load14 = load double, double* %42
  %43 = load %env__double___double_, %env__double___double_* %__environment__
  %44 = extractvalue %env__double___double_ %43, 1
  %.load15 = load double, double* %44
  %45 = fptosi double %.load14 to i32
  %46 = fptosi double %.load15 to i32
  %47 = xor i32 %45, %46
  %48 = sitofp i32 %47 to double
  %49 = load %env__double___double_, %env__double___double_* %__environment__
  %50 = extractvalue %env__double___double_ %49, 0
  %.load16 = load double, double* %50
  %51 = load %env__double___double_, %env__double___double_* %__environment__
  %52 = extractvalue %env__double___double_ %51, 1
  %.load17 = load double, double* %52
  %53 = fptosi double %.load16 to i32
  %54 = fptosi double %.load17 to i32
  %55 = shl i32 %53, %54
  %56 = sitofp i32 %55 to double
  %57 = load %env__double___double_, %env__double___double_* %__environment__
  %58 = extractvalue %env__double___double_ %57, 0
  %.load18 = load double, double* %58
  %59 = load %env__double___double_, %env__double___double_* %__environment__
  %60 = extractvalue %env__double___double_ %59, 1
  %.load19 = load double, double* %60
  %61 = fptosi double %.load18 to i32
  %62 = fptosi double %.load19 to i32
  %63 = ashr i32 %61, %62
  %64 = sitofp i32 %63 to double
  %65 = load %env__double___double_, %env__double___double_* %__environment__
  %66 = extractvalue %env__double___double_ %65, 0
  %.load20 = load double, double* %66
  %67 = load %env__double___double_, %env__double___double_* %__environment__
  %68 = extractvalue %env__double___double_ %67, 1
  %.load21 = load double, double* %68
  %69 = fptosi double %.load20 to i32
  %70 = fptosi double %.load21 to i32
  %71 = lshr i32 %69, %70
  %72 = sitofp i32 %71 to double
  ret void
}
