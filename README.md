# Yazeed English — Affiliate Program Prototype

This folder contains the first visual and workflow prototype for the Yazeed English affiliate program.

> **Important:** This is a demo only. It stores information in the current browser and is not secure. Do not use real affiliate accounts, real passwords, or real financial records in this version.

## Open the website in Visual Studio Code

1. Download and extract the ZIP file.
2. Open Visual Studio Code.
3. Select **File → Open Folder**.
4. Choose the extracted `yazeed-affiliate-starter` folder.
5. Open `login.html` in your browser. If you use the Live Server extension, right-click `login.html` and select **Open with Live Server**.

## Demo login details

**Admin account**

- Username: `ADMIN`
- Password: `Admin1234`

**Sample affiliate account**

- Username: `MOHAMMED`
- Password: `Demo1234`

These credentials are public demo credentials. Never use them on the live website.

## Main files

- `index.html` — the program landing page.
- `login.html` — the login page.
- `register.html` — the affiliate application form.
- `dashboard.html` — the affiliate dashboard.
- `admin.html` — the admin dashboard.
- `css/style.css` — all website styling, using the Yazeed English color palette and Tajawal font.
- `js/app.js` — demo login, application handling, sale records, commission calculations, and withdrawal workflow.

HTML and JavaScript are formatted with indentation and line breaks to make the code easier to read and edit in Visual Studio Code.

## Included demo workflows

- Submit an affiliate application.
- Review, approve, or reject applications in the admin dashboard.
- Create a demo affiliate account and set its commission rate.
- Add a sale manually using the original product price.
- Keep a sale hidden from the affiliate for 14 days after it is entered.
- Mark a sale as refunded, which cancels its unpaid commission in this prototype.
- Request withdrawal of the entire available balance, with a minimum of 50 SAR.
- Approve, reject, or mark a withdrawal as paid after manually transferring the money.

Product names and default prices are defined near the top of `js/app.js` in the `PRODUCTS` list.

## Known limitations before launch

- Data is stored only in the current browser using `localStorage`; it is not shared between devices or users.
- Demo authentication and passwords are not secure.
- Application emails are not sent.
- The 14-day waiting period is checked when a page is opened; there is no background server process in this prototype.
- Supabase Auth, database tables, Row Level Security, and trusted commission-release logic must be implemented before real use.

We will connect Supabase after the website layout and workflow have been reviewed.


## التعديلات الجديدة

- نموذج الانضمام يطلب الاسم والكود التسويقي المفضّل ومنصات التسويق وروابط الحسابات وطرق الترويج والتعهد.
- الكود التسويقي مستقل عن اسم المستخدم وكلمة المرور. يمكن للإدارة تعديله من تبويب **الشركاء**.
- من تبويب **طلبات الانضمام** يمكن للإدارة إضافة شريك يدويًا.
- تظهر بطاقة الكود التسويقي في لوحة الشريك مع زر نسخ.
- يظهر رابط **دعم الشركاء** أسفل الصفحات ويفتح نافذة واتساب والبريد الإلكتروني.

### إعداد بيانات دعم الشركاء

افتح `js/app.js` وابحث عن هذين السطرين في أعلى الملف، ثم أدخل بيانات التواصل الحقيقية قبل نشر الموقع:

```js
const SUPPORT_WHATSAPP = "9665XXXXXXXX"; // رقم واتساب مع مفتاح الدولة، أرقام فقط
const SUPPORT_EMAIL = "support@yourdomain.com"; // بريد الدعم الحقيقي
```

هذه نسخة تجريبية تعتمد على `localStorage` في المتصفح. البيانات لا تتزامن بين أجهزة مختلفة، ولا ينبغي استخدامها لإدارة حسابات أو مدفوعات حقيقية قبل بناء نظام آمن بخلفية وقاعدة بيانات.
