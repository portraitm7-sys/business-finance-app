# حسابات الشغل — Capacitor Android

نسخة بدون Expo نهائيًا. التطبيق Web Native باستخدام Capacitor 8 ومجهز للبناء كـ Android APK.

## ما تم تنفيذه
- تصميم أسود + ذهبي.
- اليومية: مصاريف وإيرادات.
- الصافي اليومي.
- المصاريف تتحول للأحمر عندما تكون أعلى من الإيرادات.
- الإيرادات تتحول للأخضر عندما تكون أعلى من المصاريف.
- إضافة بنود رئيسية وفرعية.
- قفل 🔒 يمنع الحذف بالخطأ، وبعد فتحه يظهر زر حذف مع تأكيد.
- شخصي: سجاير، قهوة، أكل، صحة.
- مصطفى بند مستقل.
- علي: أكل، فلوس.
- شقة مصر الجديدة: إيجار، كهرباء، مياه، غاز، مسح سلم، زبالة.
- خانة «متبقي» للحاج سيد والشيخ حماده والنزهه، ولا تدخل في الحسابات.
- تقارير شهرية وملخص تنفيذي.
- حفظ محلي Offline باستخدام localStorage داخل التطبيق.

## البناء من الموبايل — Codemagic
1. ارفع محتويات هذا المشروع إلى Repository على GitHub.
2. افتح Codemagic من متصفح الموبايل وسجل الدخول.
3. Add application ثم اختر الـRepository.
4. اختر استخدام codemagic.yaml.
5. شغّل workflow باسم Business Finance Android APK.
6. بعد انتهاء البناء افتح Artifacts وحمّل app-debug.apk.

ملف codemagic.yaml موجود بالفعل في جذر المشروع.

## بديل: GitHub Actions فقط
يوجد workflow جاهز في:
.github/workflows/build-apk.yml

بعد رفع المشروع إلى GitHub:
Actions → Build Android APK → Run workflow
وبعد اكتمال التشغيل نزّل Artifact باسم Business-Finance-APK.

## ملاحظة
هذا الـAPK Debug قابل للتثبيت مباشرة على Android ومناسب للاستخدام الشخصي. للنشر على Google Play نجهز Signed Release / AAB لاحقًا.
