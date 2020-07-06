; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 0.000000e+00, double* %1
  br label %for.condition

for.condition:                                    ; preds = %for.incrementor, %entry
  %.load = load double, double* %1
  %2 = fcmp olt double %.load, 1.000000e+01
  br i1 %2, label %for.body, label %for.exiting

for.body.latch:                                   ; preds = %for.body
  br label %for.incrementor

for.exiting:                                      ; preds = %for.condition
  br label %for.end

for.body:                                         ; preds = %for.condition
  br label %for.body.latch

for.incrementor:                                  ; preds = %for.body.latch
  %.load1 = load double, double* %1
  %3 = fadd double %.load1, 1.000000e+00
  store double %3, double* %1
  br label %for.condition

for.end:                                          ; preds = %for.exiting
  %4 = call i8* @_ZN2GC8allocateEj(i32 8)
  %5 = bitcast i8* %4 to double*
  store double 0.000000e+00, double* %5
  br label %for.condition2

for.condition2:                                   ; preds = %for.incrementor7, %for.end
  %.load3 = load double, double* %5
  %6 = fcmp olt double %.load3, 1.000000e+01
  br i1 %6, label %for.body6, label %for.exiting5

for.body.latch4:                                  ; preds = %for.body6
  br label %for.incrementor7

for.exiting5:                                     ; preds = %for.condition2
  br label %for.end9

for.body6:                                        ; preds = %for.condition2
  br label %for.body.latch4

for.incrementor7:                                 ; preds = %for.body.latch4
  %.load8 = load double, double* %5
  %7 = fadd double %.load8, 1.000000e+00
  store double %7, double* %5
  br label %for.condition2

for.end9:                                         ; preds = %for.exiting5
  %8 = call i8* @_ZN2GC8allocateEj(i32 8)
  %9 = bitcast i8* %8 to double*
  store double 0.000000e+00, double* %9
  br label %for.body12

for.body.latch10:                                 ; preds = %endif
  br label %for.incrementor14

for.exiting11:                                    ; preds = %then
  br label %for.end16

for.body12:                                       ; preds = %for.incrementor14, %for.end9
  %.load13 = load double, double* %9
  %10 = fcmp oeq double %.load13, 1.000000e+01
  br i1 %10, label %then, label %else

then:                                             ; preds = %for.body12
  br label %for.exiting11

else:                                             ; preds = %for.body12
  br label %endif

endif:                                            ; preds = %else
  br label %for.body.latch10

for.incrementor14:                                ; preds = %for.body.latch10
  %.load15 = load double, double* %9
  %11 = fadd double %.load15, 1.000000e+00
  store double %11, double* %9
  br label %for.body12

for.end16:                                        ; preds = %for.exiting11
  %12 = call i8* @_ZN2GC8allocateEj(i32 8)
  %13 = bitcast i8* %12 to double*
  store double 0.000000e+00, double* %13
  br label %for.body19

for.body.latch17:                                 ; preds = %endif23
  br label %for.incrementor24

for.exiting18:                                    ; preds = %then21
  br label %for.end26

for.body19:                                       ; preds = %for.incrementor24, %for.end16
  %.load20 = load double, double* %13
  %14 = fcmp oeq double %.load20, 1.000000e+01
  br i1 %14, label %then21, label %else22

then21:                                           ; preds = %for.body19
  br label %for.exiting18

else22:                                           ; preds = %for.body19
  br label %endif23

endif23:                                          ; preds = %else22
  br label %for.body.latch17

for.incrementor24:                                ; preds = %for.body.latch17
  %.load25 = load double, double* %13
  %15 = fadd double %.load25, 1.000000e+00
  store double %15, double* %13
  br label %for.body19

for.end26:                                        ; preds = %for.exiting18
  %16 = call i8* @_ZN2GC8allocateEj(i32 8)
  %17 = bitcast i8* %16 to double*
  store double 0.000000e+00, double* %17
  br label %for.condition27

for.condition27:                                  ; preds = %for.body.latch29, %for.end26
  %.load28 = load double, double* %17
  %18 = fcmp olt double %.load28, 1.000000e+01
  br i1 %18, label %for.body31, label %for.exiting30

for.body.latch29:                                 ; preds = %for.body31
  br label %for.condition27

for.exiting30:                                    ; preds = %for.condition27
  br label %for.end33

for.body31:                                       ; preds = %for.condition27
  %.load32 = load double, double* %17
  %19 = fadd double %.load32, 1.000000e+00
  store double %19, double* %17
  br label %for.body.latch29

for.end33:                                        ; preds = %for.exiting30
  %20 = call i8* @_ZN2GC8allocateEj(i32 8)
  %21 = bitcast i8* %20 to double*
  store double 0.000000e+00, double* %21
  br label %for.body36

for.body.latch34:                                 ; preds = %endif40
  br label %for.body36

for.exiting35:                                    ; preds = %then38
  br label %for.end42

for.body36:                                       ; preds = %for.body.latch34, %for.end33
  %.load37 = load double, double* %21
  %22 = fcmp oeq double %.load37, 1.000000e+01
  br i1 %22, label %then38, label %else39

then38:                                           ; preds = %for.body36
  br label %for.exiting35

else39:                                           ; preds = %for.body36
  br label %endif40

endif40:                                          ; preds = %else39
  %.load41 = load double, double* %21
  %23 = fadd double %.load41, 1.000000e+00
  store double %23, double* %21
  br label %for.body.latch34

for.end42:                                        ; preds = %for.exiting35
  %24 = call i8* @_ZN2GC8allocateEj(i32 8)
  %25 = bitcast i8* %24 to double*
  store double 0.000000e+00, double* %25
  br label %for.body45

for.body.latch43:                                 ; preds = %endif49
  br label %for.body45

for.exiting44:                                    ; preds = %then47
  br label %for.end51

for.body45:                                       ; preds = %for.body.latch43, %for.end42
  %.load46 = load double, double* %25
  %26 = fcmp oeq double %.load46, 1.000000e+01
  br i1 %26, label %then47, label %else48

then47:                                           ; preds = %for.body45
  br label %for.exiting44

else48:                                           ; preds = %for.body45
  br label %endif49

endif49:                                          ; preds = %else48
  %.load50 = load double, double* %25
  %27 = fadd double %.load50, 1.000000e+00
  store double %27, double* %25
  br label %for.body.latch43

for.end51:                                        ; preds = %for.exiting44
  br label %for.body54

for.body.latch52:                                 ; preds = %endif57
  br label %for.body54

for.exiting53:                                    ; preds = %then55
  br label %for.end58

for.body54:                                       ; preds = %for.body.latch52, %for.end51
  br i1 true, label %then55, label %else56

then55:                                           ; preds = %for.body54
  br label %for.exiting53

else56:                                           ; preds = %for.body54
  br label %endif57

endif57:                                          ; preds = %else56
  br label %for.body.latch52

for.end58:                                        ; preds = %for.exiting53
  %28 = call i8* @_ZN2GC8allocateEj(i32 8)
  %29 = bitcast i8* %28 to double*
  store double 0.000000e+00, double* %29
  br label %for.condition59

for.condition59:                                  ; preds = %for.incrementor67, %for.end58
  %.load60 = load double, double* %29
  %30 = fcmp olt double %.load60, 1.000000e+01
  br i1 %30, label %for.body63, label %for.exiting62

for.body.latch61:                                 ; preds = %endif66, %then64
  br label %for.incrementor67

for.exiting62:                                    ; preds = %for.condition59
  br label %for.end69

for.body63:                                       ; preds = %for.condition59
  br i1 true, label %then64, label %else65

then64:                                           ; preds = %for.body63
  br label %for.body.latch61

else65:                                           ; preds = %for.body63
  br label %endif66

endif66:                                          ; preds = %else65
  br label %for.body.latch61

for.incrementor67:                                ; preds = %for.body.latch61
  %.load68 = load double, double* %29
  %31 = fadd double %.load68, 1.000000e+00
  store double %31, double* %29
  br label %for.condition59

for.end69:                                        ; preds = %for.exiting62
  %32 = call i8* @_ZN2GC8allocateEj(i32 8)
  %33 = bitcast i8* %32 to double*
  store double 0.000000e+00, double* %33
  br label %for.condition70

for.condition70:                                  ; preds = %for.incrementor78, %for.end69
  %.load71 = load double, double* %33
  %34 = fcmp olt double %.load71, 1.000000e+01
  br i1 %34, label %for.body74, label %for.exiting73

for.body.latch72:                                 ; preds = %endif77, %then75
  br label %for.incrementor78

for.exiting73:                                    ; preds = %for.condition70
  br label %for.end80

for.body74:                                       ; preds = %for.condition70
  br i1 true, label %then75, label %else76

then75:                                           ; preds = %for.body74
  br label %for.body.latch72

else76:                                           ; preds = %for.body74
  br label %endif77

endif77:                                          ; preds = %else76
  br label %for.body.latch72

for.incrementor78:                                ; preds = %for.body.latch72
  %.load79 = load double, double* %33
  %35 = fadd double %.load79, 1.000000e+00
  store double %35, double* %33
  br label %for.condition70

for.end80:                                        ; preds = %for.exiting73
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)
