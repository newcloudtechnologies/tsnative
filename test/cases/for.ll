; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

define i32 @main() {
entry:
  %i70 = alloca double
  %i59 = alloca double
  %i43 = alloca double
  %i34 = alloca double
  %i27 = alloca double
  %i17 = alloca double
  %i10 = alloca double
  %i2 = alloca double
  %i = alloca double
  store double 0.000000e+00, double* %i
  br label %for.condition

for.condition:                                    ; preds = %for.incrementor, %entry
  %i.load = load double, double* %i
  %0 = fcmp olt double %i.load, 1.000000e+01
  br i1 %0, label %for.body, label %for.exiting

for.body.latch:                                   ; preds = %for.body
  br label %for.incrementor

for.exiting:                                      ; preds = %for.condition
  br label %for.end

for.body:                                         ; preds = %for.condition
  br label %for.body.latch

for.incrementor:                                  ; preds = %for.body.latch
  %i.load1 = load double, double* %i
  %1 = fadd double %i.load1, 1.000000e+00
  store double %1, double* %i
  br label %for.condition

for.end:                                          ; preds = %for.exiting
  store double 0.000000e+00, double* %i2
  br label %for.condition3

for.condition3:                                   ; preds = %for.incrementor7, %for.end
  %i2.load = load double, double* %i2
  %2 = fcmp olt double %i2.load, 1.000000e+01
  br i1 %2, label %for.body6, label %for.exiting5

for.body.latch4:                                  ; preds = %for.body6
  br label %for.incrementor7

for.exiting5:                                     ; preds = %for.condition3
  br label %for.end9

for.body6:                                        ; preds = %for.condition3
  br label %for.body.latch4

for.incrementor7:                                 ; preds = %for.body.latch4
  %i2.load8 = load double, double* %i2
  %3 = fadd double %i2.load8, 1.000000e+00
  store double %3, double* %i2
  br label %for.condition3

for.end9:                                         ; preds = %for.exiting5
  store double 0.000000e+00, double* %i10
  br label %for.body13

for.body.latch11:                                 ; preds = %endif
  br label %for.incrementor14

for.exiting12:                                    ; preds = %then
  br label %for.end16

for.body13:                                       ; preds = %for.incrementor14, %for.end9
  %i10.load = load double, double* %i10
  %4 = fcmp oeq double %i10.load, 1.000000e+01
  br i1 %4, label %then, label %else

then:                                             ; preds = %for.body13
  br label %for.exiting12

else:                                             ; preds = %for.body13
  br label %endif

endif:                                            ; preds = %else
  br label %for.body.latch11

for.incrementor14:                                ; preds = %for.body.latch11
  %i10.load15 = load double, double* %i10
  %5 = fadd double %i10.load15, 1.000000e+00
  store double %5, double* %i10
  br label %for.body13

for.end16:                                        ; preds = %for.exiting12
  store double 0.000000e+00, double* %i17
  br label %for.body20

for.body.latch18:                                 ; preds = %endif23
  br label %for.incrementor24

for.exiting19:                                    ; preds = %then21
  br label %for.end26

for.body20:                                       ; preds = %for.incrementor24, %for.end16
  %i17.load = load double, double* %i17
  %6 = fcmp oeq double %i17.load, 1.000000e+01
  br i1 %6, label %then21, label %else22

then21:                                           ; preds = %for.body20
  br label %for.exiting19

else22:                                           ; preds = %for.body20
  br label %endif23

endif23:                                          ; preds = %else22
  br label %for.body.latch18

for.incrementor24:                                ; preds = %for.body.latch18
  %i17.load25 = load double, double* %i17
  %7 = fadd double %i17.load25, 1.000000e+00
  store double %7, double* %i17
  br label %for.body20

for.end26:                                        ; preds = %for.exiting19
  store double 0.000000e+00, double* %i27
  br label %for.condition28

for.condition28:                                  ; preds = %for.body.latch29, %for.end26
  %i27.load = load double, double* %i27
  %8 = fcmp olt double %i27.load, 1.000000e+01
  br i1 %8, label %for.body31, label %for.exiting30

for.body.latch29:                                 ; preds = %for.body31
  br label %for.condition28

for.exiting30:                                    ; preds = %for.condition28
  br label %for.end33

for.body31:                                       ; preds = %for.condition28
  %i27.load32 = load double, double* %i27
  %9 = fadd double %i27.load32, 1.000000e+00
  store double %9, double* %i27
  br label %for.body.latch29

for.end33:                                        ; preds = %for.exiting30
  store double 0.000000e+00, double* %i34
  br label %for.body37

for.body.latch35:                                 ; preds = %endif40
  br label %for.body37

for.exiting36:                                    ; preds = %then38
  br label %for.end42

for.body37:                                       ; preds = %for.body.latch35, %for.end33
  %i34.load = load double, double* %i34
  %10 = fcmp oeq double %i34.load, 1.000000e+01
  br i1 %10, label %then38, label %else39

then38:                                           ; preds = %for.body37
  br label %for.exiting36

else39:                                           ; preds = %for.body37
  br label %endif40

endif40:                                          ; preds = %else39
  %i34.load41 = load double, double* %i34
  %11 = fadd double %i34.load41, 1.000000e+00
  store double %11, double* %i34
  br label %for.body.latch35

for.end42:                                        ; preds = %for.exiting36
  store double 0.000000e+00, double* %i43
  br label %for.body46

for.body.latch44:                                 ; preds = %endif49
  br label %for.body46

for.exiting45:                                    ; preds = %then47
  br label %for.end51

for.body46:                                       ; preds = %for.body.latch44, %for.end42
  %i43.load = load double, double* %i43
  %12 = fcmp oeq double %i43.load, 1.000000e+01
  br i1 %12, label %then47, label %else48

then47:                                           ; preds = %for.body46
  br label %for.exiting45

else48:                                           ; preds = %for.body46
  br label %endif49

endif49:                                          ; preds = %else48
  %i43.load50 = load double, double* %i43
  %13 = fadd double %i43.load50, 1.000000e+00
  store double %13, double* %i43
  br label %for.body.latch44

for.end51:                                        ; preds = %for.exiting45
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
  store double 0.000000e+00, double* %i59
  br label %for.condition60

for.condition60:                                  ; preds = %for.incrementor67, %for.end58
  %i59.load = load double, double* %i59
  %14 = fcmp olt double %i59.load, 1.000000e+01
  br i1 %14, label %for.body63, label %for.exiting62

for.body.latch61:                                 ; preds = %endif66, %then64
  br label %for.incrementor67

for.exiting62:                                    ; preds = %for.condition60
  br label %for.end69

for.body63:                                       ; preds = %for.condition60
  br i1 true, label %then64, label %else65

then64:                                           ; preds = %for.body63
  br label %for.body.latch61

else65:                                           ; preds = %for.body63
  br label %endif66

endif66:                                          ; preds = %else65
  br label %for.body.latch61

for.incrementor67:                                ; preds = %for.body.latch61
  %i59.load68 = load double, double* %i59
  %15 = fadd double %i59.load68, 1.000000e+00
  store double %15, double* %i59
  br label %for.condition60

for.end69:                                        ; preds = %for.exiting62
  store double 0.000000e+00, double* %i70
  br label %for.condition71

for.condition71:                                  ; preds = %for.incrementor78, %for.end69
  %i70.load = load double, double* %i70
  %16 = fcmp olt double %i70.load, 1.000000e+01
  br i1 %16, label %for.body74, label %for.exiting73

for.body.latch72:                                 ; preds = %endif77, %then75
  br label %for.incrementor78

for.exiting73:                                    ; preds = %for.condition71
  br label %for.end80

for.body74:                                       ; preds = %for.condition71
  br i1 true, label %then75, label %else76

then75:                                           ; preds = %for.body74
  br label %for.body.latch72

else76:                                           ; preds = %for.body74
  br label %endif77

endif77:                                          ; preds = %else76
  br label %for.body.latch72

for.incrementor78:                                ; preds = %for.body.latch72
  %i70.load79 = load double, double* %i70
  %17 = fadd double %i70.load79, 1.000000e+00
  store double %17, double* %i70
  br label %for.condition71

for.end80:                                        ; preds = %for.exiting73
  ret i32 0
}
