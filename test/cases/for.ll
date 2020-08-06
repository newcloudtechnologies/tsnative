; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %COUNT = bitcast i8* %0 to double*
  store double 1.000000e+01, double* %COUNT
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %2 = bitcast i8* %1 to double*
  store double 0.000000e+00, double* %2
  br label %for.condition

for.condition:                                    ; preds = %for.incrementor, %entry
  %3 = load double, double* %2
  %4 = load double, double* %COUNT
  %5 = fcmp olt double %3, %4
  br i1 %5, label %for.body, label %for.exiting

for.body.latch:                                   ; preds = %for.body
  br label %for.incrementor

for.exiting:                                      ; preds = %for.condition
  br label %for.end

for.body:                                         ; preds = %for.condition
  br label %for.body.latch

for.incrementor:                                  ; preds = %for.body.latch
  %6 = load double, double* %2
  %7 = fadd double %6, 1.000000e+00
  store double %7, double* %2
  br label %for.condition

for.end:                                          ; preds = %for.exiting
  %8 = call i8* @_ZN2GC8allocateEj(i32 8)
  %9 = bitcast i8* %8 to double*
  store double 0.000000e+00, double* %9
  br label %for.condition1

for.condition1:                                   ; preds = %for.incrementor5, %for.end
  %10 = load double, double* %9
  %11 = load double, double* %COUNT
  %12 = fcmp olt double %10, %11
  br i1 %12, label %for.body4, label %for.exiting3

for.body.latch2:                                  ; preds = %for.body4
  br label %for.incrementor5

for.exiting3:                                     ; preds = %for.condition1
  br label %for.end6

for.body4:                                        ; preds = %for.condition1
  br label %for.body.latch2

for.incrementor5:                                 ; preds = %for.body.latch2
  %13 = load double, double* %9
  %14 = fadd double %13, 1.000000e+00
  store double %14, double* %9
  br label %for.condition1

for.end6:                                         ; preds = %for.exiting3
  %15 = call i8* @_ZN2GC8allocateEj(i32 8)
  %16 = bitcast i8* %15 to double*
  store double 0.000000e+00, double* %16
  br label %for.body9

for.body.latch7:                                  ; preds = %endif
  br label %for.incrementor10

for.exiting8:                                     ; preds = %then
  br label %for.end11

for.body9:                                        ; preds = %for.incrementor10, %for.end6
  %17 = load double, double* %16
  %18 = load double, double* %COUNT
  %19 = fcmp oeq double %17, %18
  br i1 %19, label %then, label %else

then:                                             ; preds = %for.body9
  br label %for.exiting8

else:                                             ; preds = %for.body9
  br label %endif

endif:                                            ; preds = %else
  br label %for.body.latch7

for.incrementor10:                                ; preds = %for.body.latch7
  %20 = load double, double* %16
  %21 = fadd double %20, 1.000000e+00
  store double %21, double* %16
  br label %for.body9

for.end11:                                        ; preds = %for.exiting8
  %22 = call i8* @_ZN2GC8allocateEj(i32 8)
  %23 = bitcast i8* %22 to double*
  store double 0.000000e+00, double* %23
  br label %for.body14

for.body.latch12:                                 ; preds = %endif17
  br label %for.incrementor18

for.exiting13:                                    ; preds = %then15
  br label %for.end19

for.body14:                                       ; preds = %for.incrementor18, %for.end11
  %24 = load double, double* %23
  %25 = load double, double* %COUNT
  %26 = fcmp oeq double %24, %25
  br i1 %26, label %then15, label %else16

then15:                                           ; preds = %for.body14
  br label %for.exiting13

else16:                                           ; preds = %for.body14
  br label %endif17

endif17:                                          ; preds = %else16
  br label %for.body.latch12

for.incrementor18:                                ; preds = %for.body.latch12
  %27 = load double, double* %23
  %28 = fadd double %27, 1.000000e+00
  store double %28, double* %23
  br label %for.body14

for.end19:                                        ; preds = %for.exiting13
  %29 = call i8* @_ZN2GC8allocateEj(i32 8)
  %30 = bitcast i8* %29 to double*
  store double 0.000000e+00, double* %30
  br label %for.condition20

for.condition20:                                  ; preds = %for.body.latch21, %for.end19
  %31 = load double, double* %30
  %32 = load double, double* %COUNT
  %33 = fcmp olt double %31, %32
  br i1 %33, label %for.body23, label %for.exiting22

for.body.latch21:                                 ; preds = %for.body23
  br label %for.condition20

for.exiting22:                                    ; preds = %for.condition20
  br label %for.end24

for.body23:                                       ; preds = %for.condition20
  %34 = load double, double* %30
  %35 = fadd double %34, 1.000000e+00
  store double %35, double* %30
  br label %for.body.latch21

for.end24:                                        ; preds = %for.exiting22
  %36 = call i8* @_ZN2GC8allocateEj(i32 8)
  %37 = bitcast i8* %36 to double*
  store double 0.000000e+00, double* %37
  br label %for.body27

for.body.latch25:                                 ; preds = %endif30
  br label %for.body27

for.exiting26:                                    ; preds = %then28
  br label %for.end31

for.body27:                                       ; preds = %for.body.latch25, %for.end24
  %38 = load double, double* %37
  %39 = load double, double* %COUNT
  %40 = fcmp oeq double %38, %39
  br i1 %40, label %then28, label %else29

then28:                                           ; preds = %for.body27
  br label %for.exiting26

else29:                                           ; preds = %for.body27
  br label %endif30

endif30:                                          ; preds = %else29
  %41 = load double, double* %37
  %42 = fadd double %41, 1.000000e+00
  store double %42, double* %37
  br label %for.body.latch25

for.end31:                                        ; preds = %for.exiting26
  %43 = call i8* @_ZN2GC8allocateEj(i32 8)
  %44 = bitcast i8* %43 to double*
  store double 0.000000e+00, double* %44
  br label %for.body34

for.body.latch32:                                 ; preds = %endif37
  br label %for.body34

for.exiting33:                                    ; preds = %then35
  br label %for.end38

for.body34:                                       ; preds = %for.body.latch32, %for.end31
  %45 = load double, double* %44
  %46 = load double, double* %COUNT
  %47 = fcmp oeq double %45, %46
  br i1 %47, label %then35, label %else36

then35:                                           ; preds = %for.body34
  br label %for.exiting33

else36:                                           ; preds = %for.body34
  br label %endif37

endif37:                                          ; preds = %else36
  %48 = load double, double* %44
  %49 = fadd double %48, 1.000000e+00
  store double %49, double* %44
  br label %for.body.latch32

for.end38:                                        ; preds = %for.exiting33
  br label %for.body41

for.body.latch39:                                 ; preds = %endif44
  br label %for.body41

for.exiting40:                                    ; preds = %then42
  br label %for.end45

for.body41:                                       ; preds = %for.body.latch39, %for.end38
  %50 = call i8* @_ZN2GC8allocateEj(i32 1)
  %51 = bitcast i8* %50 to i1*
  store i1 true, i1* %51
  %52 = load i1, i1* %51
  br i1 %52, label %then42, label %else43

then42:                                           ; preds = %for.body41
  br label %for.exiting40

else43:                                           ; preds = %for.body41
  br label %endif44

endif44:                                          ; preds = %else43
  br label %for.body.latch39

for.end45:                                        ; preds = %for.exiting40
  %53 = call i8* @_ZN2GC8allocateEj(i32 8)
  %54 = bitcast i8* %53 to double*
  store double 0.000000e+00, double* %54
  br label %for.condition46

for.condition46:                                  ; preds = %for.incrementor53, %for.end45
  %55 = load double, double* %54
  %56 = load double, double* %COUNT
  %57 = fcmp olt double %55, %56
  br i1 %57, label %for.body49, label %for.exiting48

for.body.latch47:                                 ; preds = %endif52, %then50
  br label %for.incrementor53

for.exiting48:                                    ; preds = %for.condition46
  br label %for.end54

for.body49:                                       ; preds = %for.condition46
  %58 = call i8* @_ZN2GC8allocateEj(i32 1)
  %59 = bitcast i8* %58 to i1*
  store i1 true, i1* %59
  %60 = load i1, i1* %59
  br i1 %60, label %then50, label %else51

then50:                                           ; preds = %for.body49
  br label %for.body.latch47

else51:                                           ; preds = %for.body49
  br label %endif52

endif52:                                          ; preds = %else51
  br label %for.body.latch47

for.incrementor53:                                ; preds = %for.body.latch47
  %61 = load double, double* %54
  %62 = fadd double %61, 1.000000e+00
  store double %62, double* %54
  br label %for.condition46

for.end54:                                        ; preds = %for.exiting48
  %63 = call i8* @_ZN2GC8allocateEj(i32 8)
  %64 = bitcast i8* %63 to double*
  store double 0.000000e+00, double* %64
  br label %for.condition55

for.condition55:                                  ; preds = %for.incrementor62, %for.end54
  %65 = load double, double* %64
  %66 = load double, double* %COUNT
  %67 = fcmp olt double %65, %66
  br i1 %67, label %for.body58, label %for.exiting57

for.body.latch56:                                 ; preds = %endif61, %then59
  br label %for.incrementor62

for.exiting57:                                    ; preds = %for.condition55
  br label %for.end63

for.body58:                                       ; preds = %for.condition55
  %68 = call i8* @_ZN2GC8allocateEj(i32 1)
  %69 = bitcast i8* %68 to i1*
  store i1 true, i1* %69
  %70 = load i1, i1* %69
  br i1 %70, label %then59, label %else60

then59:                                           ; preds = %for.body58
  br label %for.body.latch56

else60:                                           ; preds = %for.body58
  br label %endif61

endif61:                                          ; preds = %else60
  br label %for.body.latch56

for.incrementor62:                                ; preds = %for.body.latch56
  %71 = load double, double* %64
  %72 = fadd double %71, 1.000000e+00
  store double %72, double* %64
  br label %for.condition55

for.end63:                                        ; preds = %for.exiting57
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)
