/*
 * Yazeed English — Affiliate Program Prototype
 * ------------------------------------------------------------
 * This file is intentionally formatted for beginners to read.
 * Demo data is stored in localStorage and is NOT secure.
 * Replace demo storage and authentication with Supabase before launch.
 */

(() => {
    "use strict";

        // HTML element helpers used throughout this file.
    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    // --------------------------------------------------------
    // 1. SETTINGS AND DEMO DATA
    // --------------------------------------------------------

    const STORAGE_KEY = "ye_affiliate_demo_v1";
    const SESSION_KEY = "ye_affiliate_demo_session";
    const WAITING_PERIOD_DAYS = 0;
    const MINIMUM_WITHDRAWAL = 50;

    // Edit this list when you add or rename a product.
    const PRODUCTS = [
        {
            id: "step",
            name: "دورة STEP",
            price: 99
        },
        {
            id: "english",
            name: "برنامج الإنجليزي",
            price: 49
        },
        {
            id: "trab6",
            name: "دورة ترابط 6",
            price: 19
        },
        {
            id: "writing",
            name: "دورة الكتابة",
            price: 49
        }
    ];

    const INITIAL_DATA = {
        applications: [],
        affiliates: [
            {
                id: "a1",
                name: "محمد",
                username: "demo",
                password: "1234",
                preferredCode: "MOHAMED",
                rate: 30,
                email: "mohammed@example.com",
                status: "active"
            }
        ],
        sales: [],
        withdrawals: []
    };

 if (typeof setupSupportPopup === "function") {
        setupSupportPopup();
    }

    function loadData() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) {
                return JSON.parse(JSON.stringify(INITIAL_DATA));
            }

            const data = JSON.parse(savedData);
            data.applications = Array.isArray(data.applications) ? data.applications : [];
            data.affiliates = Array.isArray(data.affiliates) ? data.affiliates : [];
            data.sales = Array.isArray(data.sales) ? data.sales : [];
            data.withdrawals = Array.isArray(data.withdrawals) ? data.withdrawals : [];

            // Give the original demo affiliate a promo code when loading older saved data.
            data.affiliates.forEach((affiliate) => {
                if (!affiliate.preferredCode && !affiliate.promoCode && String(affiliate.username || "").toUpperCase() === "MOHAMMED") {
                    affiliate.preferredCode = "MOHAMED";
                }
            });

            return data;
        } catch (error) {
            console.error("Could not load demo data:", error);
            return JSON.parse(JSON.stringify(INITIAL_DATA));
        }
    }

    let db = loadData();

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        } catch (error) {
            console.error("Could not save demo data:", error);
            alert("تعذر حفظ البيانات في هذا المتصفح.");
        }
    }

    function money(amount) {
        const value = Number(amount) || 0;

        return `${value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ر.س`;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const dateValue = value.length === 10
            ? `${value}T12:00:00`
            : value;

        return new Date(dateValue).toLocaleDateString("ar-SA");
    }

    function showMessage(element, message) {
        if (element) {
            element.textContent = message;
        }
    }

    function getSession() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY));
        } catch (error) {
            return null;
        }
    }

    function goToLogin() {
        window.location.href = "/login";
    }

    function getProduct(productId) {
        return PRODUCTS.find((product) => product.id === productId);
    }

    function getAffiliate(affiliateId) {
        return db.affiliates.find((affiliate) => affiliate.id === affiliateId);
    }

    function getAffiliateName(affiliateId) {
        return getAffiliate(affiliateId)?.name || "شريك";
    }

    function getCommission(sale) {
        return Number(sale.price) * Number(sale.rate) / 100;
    }

    function isSaleReleased(sale) {
        const enteredAt = new Date(sale.enteredAt).getTime();
        const waitingPeriod = WAITING_PERIOD_DAYS * 24 * 60 * 60 * 1000;

        return Date.now() >= enteredAt + waitingPeriod;
    }

    function getReleasedSales(affiliateId) {
        return db.sales.filter((sale) => {
            return sale.affiliateId === affiliateId
                && sale.status === "active"
                && isSaleReleased(sale);
        });
    }

    function getAvailableBalance(affiliateId) {
        const earnedCommission = getReleasedSales(affiliateId)
            .reduce((total, sale) => total + getCommission(sale), 0);

        const reservedOrPaidWithdrawals = db.withdrawals
            .filter((withdrawal) => {
                return withdrawal.affiliateId === affiliateId
                    && ["requested", "approved", "paid"].includes(withdrawal.status);
            })
            .reduce((total, withdrawal) => total + withdrawal.amount, 0);

        return Math.max(0, earnedCommission - reservedOrPaidWithdrawals);
    }

    function getWithdrawalStatusLabel(status) {
        const labels = {
            requested: "بانتظار المراجعة",
            approved: "تمت الموافقة",
            paid: "تم الدفع",
            rejected: "مرفوض"
        };

        return labels[status] || "غير معروف";
    }

    // --------------------------------------------------------
    // 3. LOGOUT BUTTONS
    // --------------------------------------------------------

    $$('[data-logout]').forEach((button) => {
        button.addEventListener("click", () => {
            sessionStorage.removeItem(SESSION_KEY);
            goToLogin();
        });
    });

    // --------------------------------------------------------
    // 4. AFFILIATE APPLICATION FORM
    // --------------------------------------------------------

    const registrationForm = $("#registerForm");

    if (registrationForm) {
        const platformDetails = $("#platformDetails");
        const platformLabels = {
            snapchat: "Snapchat",
            tiktok: "TikTok",
            instagram: "Instagram",
            x: "X (Twitter)",
            youtube: "YouTube",
            telegram: "Telegram",
            other: "المنصة الأخرى"
        };

        function renderPlatformFields() {
            const selected = $$('input[name="platforms"]:checked');
            platformDetails.innerHTML = selected.map((checkbox) => {
                const platform = checkbox.dataset.platform;
                return `
                    <label class="platform-field">
                        ${escapeHTML(platformLabels[platform] || checkbox.value)} — رابط الحساب أو اسم المستخدم
                        <input type="text" name="platformDetail-${escapeHTML(platform)}" data-platform-detail="${escapeHTML(platform)}" maxlength="250" placeholder="رابط الحساب أو اسم المستخدم" required>
                    </label>`;
            }).join("");
        }

        $$('input[name="platforms"]').forEach((checkbox) => {
            checkbox.addEventListener("change", renderPlatformFields);
        });

        registrationForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = new FormData(registrationForm);
            const name = String(formData.get("name") || "").trim();
            const preferredCode = String(formData.get("preferredCode") || "").trim().toUpperCase();
            const about = String(formData.get("about") || "").trim();
            const platformsSelected = $$('input[name="platforms"]:checked');
            const methods = formData.getAll("methods").map((item) => String(item));

            if (!/^[A-Z0-9]{3,7}$/.test(preferredCode)) {
                showMessage($("#message"), "الكود يجب أن يتكون من 3 إلى 7 أحرف أو أرقام إنجليزية فقط");
                return;
            }
            if (platformsSelected.length === 0) {
                showMessage($("#message"), "اختر منصة تسويق واحدة على الأقل");
                return;
            }
            if (methods.length === 0) {
                showMessage($("#message"), "اختر طريقة تسويق واحدة على الأقل");
                return;
            }
            if (!formData.get("agreement")) {
                showMessage($("#message"), "يجب الموافقة على التعهد قبل إرسال الطلب");
                return;
            }

            const platforms = platformsSelected.map((checkbox) => ({
                name: checkbox.value,
                key: checkbox.dataset.platform,
                account: String(formData.get(`platformDetail-${checkbox.dataset.platform}`) || "").trim()
            }));

            if (platforms.some((platform) => !platform.account)) {
                showMessage($("#message"), "أدخل رابط الحساب أو اسم المستخدم لكل منصة اخترتها.");
                return;
            }

            const codeAlreadyUsed = [
                ...db.applications.filter((application) => application.status !== "rejected"),
                ...db.affiliates
            ].some((person) => String(person.preferredCode || person.promoCode || "").toUpperCase() === preferredCode);

            if (codeAlreadyUsed) {
                showMessage($("#message"), "هذا الكود مستخدم أو محجوز بالفعل. اختر كودًا آخر");
                return;
            }

            db.applications.unshift({
                id: `app-${Date.now()}`,
                name,
                preferredCode,
                platforms,
                methods,
                about,
                agreement: true,
                status: "pending",
                createdAt: new Date().toISOString()
            });

            saveData();
            registrationForm.reset();
            renderPlatformFields();
            showMessage($("#message"), "تم استلام طلبك في النسخة التجريبية، وستراجعه الإدارة يدويًا");
        });
    }

    // --------------------------------------------------------
    // 5. LOGIN FORM
    // --------------------------------------------------------

    const loginForm = $("#loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const username = String(formData.get("username") || "")
                .trim()
                .toUpperCase();
            const password = String(formData.get("password") || "");

            // Public demo admin account. Never use this for a live website.
            if (username === "admin" && password === "1234") {
                sessionStorage.setItem(
                    SESSION_KEY,
                    JSON.stringify({ role: "admin" })
                );

                window.location.href = "/admin";
                return;
            }

            const affiliate = db.affiliates.find((item) => {
                return item.username.toUpperCase() === username
                    && item.password === password
                    && item.status === "active";
            });

            if (!affiliate) {
                showMessage(
                    $("#message"),
                    "رمز الشريك أو كلمة المرور غير صحيح"
                );
                return;
            }

            sessionStorage.setItem(
                SESSION_KEY,
                JSON.stringify({
                    role: "affiliate",
                    id: affiliate.id
                })
            );

            window.location.href = "/dashboard";
        });
    }

    // --------------------------------------------------------
    // 6. AFFILIATE DASHBOARD
    // --------------------------------------------------------
    // Use the withdrawal list to identify the dashboard page.
    // This avoids confusing the dashboard sales statistic with the
    // admin page's section whose ID is also "sales".

    const withdrawalList = $("#withdrawalList");

    if (withdrawalList) {
        const session = getSession();

        if (!session || session.role !== "affiliate") {
            goToLogin();
        } else {
            const affiliate = getAffiliate(session.id);

            if (!affiliate) {
                goToLogin();
            } else {
                $("#name").textContent = affiliate.name;
                const promoCodeElement = $("#promoCode");
                const copyPromoCodeButton = $("#copyPromoCode");
                const promoCode = affiliate.preferredCode || affiliate.promoCode || "—";
                if (promoCodeElement) promoCodeElement.textContent = promoCode;
                if (copyPromoCodeButton) {
                    copyPromoCodeButton.addEventListener("click", async () => {
                        if (!promoCode || promoCode === "—") {
                            alert("لم يتم تعيين كود تسويقي لهذا الحساب بعد.");
                            return;
                        }
                        try {
                            await navigator.clipboard.writeText(promoCode);
                            copyPromoCodeButton.textContent = "تم النسخ ✓";
                            setTimeout(() => { copyPromoCodeButton.textContent = "نسخ الكود"; }, 1800);
                        } catch (error) {
                            const temporaryInput = document.createElement("textarea");
                            temporaryInput.value = promoCode;
                            temporaryInput.style.position = "fixed";
                            temporaryInput.style.opacity = "0";
                            document.body.appendChild(temporaryInput);
                            temporaryInput.select();
                            document.execCommand("copy");
                            temporaryInput.remove();
                            copyPromoCodeButton.textContent = "تم النسخ ✓";
                            setTimeout(() => { copyPromoCodeButton.textContent = "نسخ الكود"; }, 1800);
                        }
                    });
                }

                const releasedSales = getReleasedSales(affiliate.id);
                const affiliateWithdrawals = db.withdrawals.filter(
                    (withdrawal) => withdrawal.affiliateId === affiliate.id
                );

                const totalCommission = releasedSales.reduce(
                    (total, sale) => total + getCommission(sale),
                    0
                );

                $("#sales").textContent = releasedSales.length;
                $("#commission").textContent = money(totalCommission);
                $("#balance").textContent = money(
                    getAvailableBalance(affiliate.id)
                );
                $("#withdrawals").textContent = affiliateWithdrawals.length;

                if (affiliateWithdrawals.length > 0) {
                    withdrawalList.innerHTML = affiliateWithdrawals.map((withdrawal) => {
                        return `
                            <div class="item">
                                <div>
                                    <strong>${money(withdrawal.amount)}</strong>
                                    <small>
                                        ${formatDate(withdrawal.createdAt)}
                                        · ${getWithdrawalStatusLabel(withdrawal.status)}
                                    </small>
                                </div>
                            </div>
                        `;
                    }).join("");
                } else {
                    withdrawalList.textContent = "لا توجد طلبات حتى الآن.";
                }

                $("#requestWithdrawal").addEventListener("click", () => {
                    const availableBalance = getAvailableBalance(affiliate.id);

                    if (availableBalance < MINIMUM_WITHDRAWAL) {
                        alert("الحد الأدنى للسحب 50 ريال");
                        return;
                    }

                    const hasPendingWithdrawal = affiliateWithdrawals.some((withdrawal) => {
                        return ["requested", "approved"].includes(withdrawal.status);
                    });

                    if (hasPendingWithdrawal) {
                        alert("لديك طلب سحب قيد المعالجة");
                        return;
                    }

                    const confirmed = confirm(
                        `هل تريد طلب سحب كامل الرصيد المتاح: ${money(availableBalance)}؟`
                    );

                    if (!confirmed) {
                        return;
                    }

                    db.withdrawals.unshift({
                        id: `withdrawal-${Date.now()}`,
                        affiliateId: affiliate.id,
                        amount: availableBalance,
                        status: "requested",
                        createdAt: new Date().toISOString()
                    });

                    saveData();
                    window.location.reload();
                });
            }
        }
    }

    // --------------------------------------------------------
    // 7. ADMIN DASHBOARD
    // --------------------------------------------------------

    const applicationsList = $("#applicationsList");

    if (applicationsList) {
        const session = getSession();

        if (!session || session.role !== "admin") {
            goToLogin();
        } else {
            setupAdminDashboard();
        }
    }

    function setupAdminDashboard() {
        const tabs = $$(".tab");

        // Tab navigation.
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((item) => {
                    item.classList.toggle("active", item === tab);
                });

                $$(".tab-panel").forEach((panel) => {
                    panel.classList.toggle("hidden", panel.id !== tab.dataset.tab);
                });
            });
        });

        const affiliateSelect = $("#affiliateSelect");
        const productSelect = $("#productSelect");
        const saleForm = $("#saleForm");
        const priceInput = $('input[name="price"]');
        const dateInput = $('input[name="date"]');

        function fillAffiliateOptions() {
            const activeAffiliates = db.affiliates.filter(
                (affiliate) => affiliate.status === "active"
            );

            affiliateSelect.innerHTML = activeAffiliates.map((affiliate) => {
                return `
                    <option value="${escapeHTML(affiliate.id)}">
                        ${escapeHTML(affiliate.name)}
                        (${escapeHTML(affiliate.username)})
                    </option>
                `;
            }).join("");

            if (activeAffiliates.length === 0) {
                affiliateSelect.innerHTML = '<option value="">لا يوجد شركاء نشطون</option>';
            }
        }

        function updateCommissionPreview() {
            const affiliate = getAffiliate(affiliateSelect.value);
            const price = Number(priceInput.value || 0);
            const rate = Number(affiliate?.rate || 0);

            $("#preview").textContent = `العمولة التقديرية: ${money(price * rate / 100)}`;
        }

        function renderApplications() {
            const pendingApplications = db.applications.filter(
                (application) => application.status === "pending"
            );

            if (pendingApplications.length === 0) {
                $("#applicationsList").innerHTML = '<div class="empty">لا توجد طلبات جديدة.</div>';
                return;
            }

            $("#applicationsList").innerHTML = pendingApplications.map((application) => {
                return `
                    <div class="item">
                        <div class="item-content">
                            <strong>${escapeHTML(application.name)}</strong>
                            <small>الكود المفضّل: <strong>${escapeHTML(application.preferredCode || "لم يحدد")}</strong></small>
                            ${(application.platforms || []).map((platform) => `<small>${escapeHTML(platform.name)}: ${escapeHTML(platform.account)}</small>`).join("")}
                            <small>طرق التسويق: ${escapeHTML((application.methods || []).join("، ") || "—")}</small>
                            <small>نبذة: ${escapeHTML(application.about || "لم يضف نبذة")}</small>
                            ${application.email ? `<small>${escapeHTML(application.email)}</small>` : ""}
                            <small>تاريخ الطلب: ${formatDate(application.createdAt)}</small>
                        </div>

                        <div class="actions">
                            <button class="btn green" data-approve="${escapeHTML(application.id)}">
                                موافقة
                            </button>
                            <button class="btn red" data-reject="${escapeHTML(application.id)}">
                                رفض
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        function renderAffiliates() {
            if (db.affiliates.length === 0) {
                $("#affiliatesList").innerHTML = '<div class="empty">لا يوجد شركاء حتى الآن.</div>';
                return;
            }

            $("#affiliatesList").innerHTML = db.affiliates.map((affiliate) => {
                return `
                    <div class="item">
                        <div class="item-content">
                            <strong>
                                ${escapeHTML(affiliate.name)}
                                · ${escapeHTML(affiliate.username)}
                            </strong>
                            <small>${escapeHTML(affiliate.email || "لا يوجد بريد مسجل")}</small>
                            <small>الكود التسويقي: <strong>${escapeHTML(affiliate.preferredCode || affiliate.promoCode || "غير محدد")}</strong></small>
                            <small>
                                العمولة ${Number(affiliate.rate)}%
                                · الرصيد ${money(getAvailableBalance(affiliate.id))}
                            </small>
                            <small>الحالة: ${affiliate.status === "active" ? "نشط" : "غير نشط"}</small>
                        </div>

                        <div class="actions">
                            <button class="btn secondary" data-code="${escapeHTML(affiliate.id)}">تعديل الكود</button>
                            <button class="btn secondary" data-rate="${escapeHTML(affiliate.id)}">تعديل النسبة</button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        function renderSales() {
            if (db.sales.length === 0) {
                $("#salesList").innerHTML = '<div class="empty">لا توجد مبيعات مسجلة.</div>';
                return;
            }

            $("#salesList").innerHTML = db.sales.map((sale) => {
                let releaseStatus = "انتهت فترة الانتظار";

                if (sale.status === "refunded") {
                    releaseStatus = "مسترد — العمولة ملغاة";
                } else if (!isSaleReleased(sale)) {
                    releaseStatus = "مخفي عن الشريك حتى انتهاء 14 يومًا";
                }

                const product = getProduct(sale.productId);
                const refundButton = sale.status === "active"
                    ? `<button class="btn red" data-refund="${escapeHTML(sale.id)}">تسجيل استرداد</button>`
                    : "";

                return `
                    <div class="item">
                        <div class="item-content">
                            <strong>
                                ${escapeHTML(product?.name || sale.productId)}
                                · ${escapeHTML(getAffiliateName(sale.affiliateId))}
                            </strong>
                            <small>
                                رقم الطلب ${escapeHTML(sale.order)}
                                · تاريخ الطلب ${formatDate(sale.orderDate)}
                            </small>
                            <small>
                                السعر الأصلي ${money(sale.price)}
                                · العمولة ${money(getCommission(sale))}
                            </small>
                            <small>${releaseStatus}</small>
                        </div>

                        ${refundButton}
                    </div>
                `;
            }).join("");
        }

        function renderWithdrawals() {
            if (db.withdrawals.length === 0) {
                $("#withdrawalsList").innerHTML = '<div class="empty">لا توجد طلبات سحب.</div>';
                return;
            }

            $("#withdrawalsList").innerHTML = db.withdrawals.map((withdrawal) => {
                let actionButtons = "";

                if (withdrawal.status === "requested") {
                    actionButtons = `
                        <button class="btn green" data-wapprove="${escapeHTML(withdrawal.id)}">
                            موافقة
                        </button>
                        <button class="btn red" data-wreject="${escapeHTML(withdrawal.id)}">
                            رفض
                        </button>
                    `;
                } else if (withdrawal.status === "approved") {
                    actionButtons = `
                        <button class="btn green" data-paid="${escapeHTML(withdrawal.id)}">
                            تم التحويل
                        </button>
                    `;
                }

                return `
                    <div class="item">
                        <div class="item-content">
                            <strong>
                                ${escapeHTML(getAffiliateName(withdrawal.affiliateId))}
                                · ${money(withdrawal.amount)}
                            </strong>
                            <small>
                                ${formatDate(withdrawal.createdAt)}
                                · ${getWithdrawalStatusLabel(withdrawal.status)}
                            </small>
                        </div>

                        <div class="actions">${actionButtons}</div>
                    </div>
                `;
            }).join("");
        }

        function renderAdminLists() {
            renderApplications();
            renderAffiliates();
            renderSales();
            renderWithdrawals();
            fillAffiliateOptions();
            updateCommissionPreview();
        }

        // Select a product to prefill its default price.
        productSelect.addEventListener("change", () => {
            const product = getProduct(productSelect.value);

            if (product) {
                priceInput.value = product.price;
            }

            updateCommissionPreview();
        });

        affiliateSelect.addEventListener("change", updateCommissionPreview);
        priceInput.addEventListener("input", updateCommissionPreview);

        dateInput.value = new Date().toISOString().slice(0, 10);

        // Add a sale manually from the Salla order details.
        saleForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(saleForm);
            const affiliateId = String(formData.get("affiliate") || "");
            const productId = String(formData.get("product") || "");
            const orderNumber = String(formData.get("order") || "").trim();
            const orderDate = String(formData.get("date") || "");
            const originalPrice = Number(formData.get("price"));
            const affiliate = getAffiliate(affiliateId);
            const product = getProduct(productId);

            if (!affiliate || affiliate.status !== "active") {
                alert("اختر شريكًا نشطًا أولًا.");
                return;
            }

            if (!product) {
                alert("اختر منتجًا صحيحًا.");
                return;
            }

            if (!orderNumber || !orderDate || !Number.isFinite(originalPrice) || originalPrice <= 0) {
                alert("تحقق من رقم الطلب والتاريخ والسعر الأصلي");
                return;
            }

            const duplicateSale = db.sales.some((sale) => {
                return sale.order === orderNumber && sale.productId === productId;
            });

            if (duplicateSale) {
                alert("هذا المنتج من رقم الطلب مسجل مسبقًا");
                return;
            }

            db.sales.unshift({
                id: `sale-${Date.now()}`,
                affiliateId,
                productId,
                order: orderNumber,
                orderDate,
                price: originalPrice,
                rate: Number(affiliate.rate),
                enteredAt: new Date().toISOString(),
                status: "active"
            });

            saveData();
            saleForm.reset();
            dateInput.value = new Date().toISOString().slice(0, 10);

            const firstProduct = getProduct(productSelect.value);
            if (firstProduct) {
                priceInput.value = firstProduct.price;
            }

            renderAdminLists();

            alert(
                "تمت إضافة البيع في النسخة التجريبية. ستظهر العمولة للشريك بعد 14 يومًا من وقت الإدخال."
            );
        });

        // Admin actions for applications, sales, affiliates and withdrawals.
        document.addEventListener("click", (event) => {
            const button = event.target.closest("button");

            if (!button) {
                return;
            }

            // Add an affiliate manually without an application.
            if (button.id === "addAffiliate") {
                const nameInput = prompt("اسم الشريك:");
                if (!nameInput || !nameInput.trim()) return;
                const name = nameInput.trim();

                const suggestedCode = name.replace(/[^a-z0-9]/gi, "").slice(0, 7).toUpperCase();
                const codeInput = prompt("الكود التسويقي (3 إلى 7 أحرف أو أرقام):", suggestedCode);
                if (!codeInput) return;
                const preferredCode = codeInput.trim().toUpperCase();
                if (!/^[A-Z0-9]{3,7}$/.test(preferredCode)) {
                    alert("يجب أن يتكون الكود من 3 إلى 7 أحرف أو أرقام إنجليزية فقط.");
                    return;
                }
                if (db.affiliates.some((item) => String(item.preferredCode || item.promoCode || "").toUpperCase() === preferredCode)) {
                    alert("هذا الكود مستخدم بالفعل. اختر كودًا آخر.");
                    return;
                }

                const usernameInput = prompt("اسم المستخدم لتسجيل الدخول:", preferredCode);
                if (!usernameInput || !usernameInput.trim()) return;
                const username = usernameInput.trim().toUpperCase();
                if (db.affiliates.some((item) => item.username.toUpperCase() === username)) {
                    alert("اسم المستخدم مستخدم بالفعل.");
                    return;
                }

                const password = prompt("كلمة مرور تجريبية من 8 أحرف أو أرقام على الأقل:");
                if (!password || password.length < 8) {
                    alert("يجب أن تتكون كلمة المرور من 8 أحرف أو أرقام على الأقل.");
                    return;
                }
                const rateInput = prompt("نسبة العمولة (%)", "20");
                const rate = Number(rateInput);
                if (rateInput === null || !Number.isFinite(rate) || rate < 0 || rate > 100) {
                    alert("أدخل نسبة عمولة من 0 إلى 100.");
                    return;
                }

                db.affiliates.push({
                    id: `affiliate-${Date.now()}`,
                    name,
                    username,
                    password,
                    preferredCode,
                    rate,
                    email: "",
                    status: "active"
                });
                saveData();
                renderAdminLists();
                alert("تمت إضافة الشريك. احفظ بيانات الدخول وأرسلها له بطريقة آمنة.");
                return;
            }

            // Approve an application and create a demo affiliate account.
            if (button.dataset.approve) {
                const application = db.applications.find(
                    (item) => item.id === button.dataset.approve
                );

                if (!application) {
                    return;
                }

                const suggestedUsername = application.name
                    .replace(/\s+/g, "")
                    .toUpperCase();

                const usernameInput = prompt(
                    "اسم المستخدم لتسجيل الدخول:",
                    suggestedUsername
                );

                if (!usernameInput) {
                    return;
                }

                const username = usernameInput.trim().toUpperCase();

                if (!username) {
                    alert("أدخل رمزًا للشريك.");
                    return;
                }

                const usernameAlreadyUsed = db.affiliates.some((affiliate) => {
                    return affiliate.username.toUpperCase() === username;
                });

                if (usernameAlreadyUsed) {
                    alert("هذا الرمز مستخدم بالفعل");
                    return;
                }

                const suggestedCode = String(application.preferredCode || suggestedUsername.replace(/[^A-Z0-9]/g, "").slice(0, 7)).toUpperCase();
                const codeInput = prompt("الكود التسويقي (3 إلى 7 أحرف أو أرقام):", suggestedCode);
                if (!codeInput) return;
                const preferredCode = codeInput.trim().toUpperCase();
                if (!/^[A-Z0-9]{3,7}$/.test(preferredCode)) {
                    alert("يجب أن يتكون الكود التسويقي من 3 إلى 7 أحرف أو أرقام إنجليزية فقط");
                    return;
                }
                const codeAlreadyUsed = db.affiliates.some((item) => String(item.preferredCode || item.promoCode || "").toUpperCase() === preferredCode && item.id !== application.id);
                if (codeAlreadyUsed) {
                    alert("هذا الكود مستخدم بالفعل.");
                    return;
                }

                const password = prompt(
                    "كلمة مرور تجريبية من 8 أحرف أو أرقام على الأقل:"
                );

                if (!password || password.length < 8) {
                    alert("يجب أن تتكون كلمة المرور من 8 أحرف أو أرقام على الأقل");
                    return;
                }

                const rateInput = prompt("نسبة العمولة (%)", "20");
                const rate = Number(rateInput);

                if (rateInput === null || !Number.isFinite(rate) || rate < 0 || rate > 100) {
                    alert("أدخل نسبة عمولة من 0 إلى 100");
                    return;
                }

                db.affiliates.push({
                    id: `affiliate-${Date.now()}`,
                    name: application.name,
                    username,
                    password,
                    rate,
                    preferredCode,
                    email: application.email || "",
                    status: "active"
                });

                application.status = "approved";
                saveData();
                renderAdminLists();

                alert(
                    "تم إنشاء الحساب التجريبي. لا تستخدم كلمة مرور حقيقية في هذه النسخة"
                );
                return;
            }

            // Reject an application.
            if (button.dataset.reject) {
                const application = db.applications.find(
                    (item) => item.id === button.dataset.reject
                );

                if (application) {
                    application.status = "rejected";
                    saveData();
                    renderAdminLists();
                }

                return;
            }

            // Change an affiliate's marketing code.
            if (button.dataset.code) {
                const affiliate = getAffiliate(button.dataset.code);
                if (!affiliate) return;
                const currentCode = affiliate.preferredCode || affiliate.promoCode || "";
                const codeInput = prompt("الكود التسويقي الجديد (3 إلى 7 أحرف أو أرقام):", currentCode);
                if (codeInput === null) return;
                const newCode = codeInput.trim().toUpperCase();
                if (!/^[A-Z0-9]{3,7}$/.test(newCode)) {
                    alert("يجب أن يتكون الكود من 3 إلى 7 أحرف أو أرقام إنجليزية فقط");
                    return;
                }
                const codeAlreadyUsed = db.affiliates.some((item) => item.id !== affiliate.id && String(item.preferredCode || item.promoCode || "").toUpperCase() === newCode);
                if (codeAlreadyUsed) {
                    alert("هذا الكود مستخدم لدى شريك آخر.");
                    return;
                }
                affiliate.preferredCode = newCode;
                delete affiliate.promoCode;
                saveData();
                renderAdminLists();
                return;
            }

            // Change an affiliate's commission rate.
            if (button.dataset.rate) {
                const affiliate = getAffiliate(button.dataset.rate);

                if (!affiliate) {
                    return;
                }

                const rateInput = prompt("نسبة العمولة الجديدة (%)", affiliate.rate);

                if (rateInput === null || rateInput.trim() === "") {
                    return;
                }

                const newRate = Number(rateInput);

                if (!Number.isFinite(newRate) || newRate < 0 || newRate > 100) {
                    alert("أدخل نسبة عمولة من 0 إلى 100.");
                    return;
                }

                affiliate.rate = newRate;
                saveData();
                renderAdminLists();
                return;
            }

            // Mark a sale as refunded and cancel its commission.
            if (button.dataset.refund) {
                const sale = db.sales.find(
                    (item) => item.id === button.dataset.refund
                );

                if (sale && confirm("تسجيل الاسترداد وإلغاء العمولة لهذه العملية؟")) {
                    sale.status = "refunded";
                    saveData();
                    renderAdminLists();
                }

                return;
            }

            // Approve, reject or mark a withdrawal as paid.
            const withdrawalId = button.dataset.wapprove
                || button.dataset.wreject
                || button.dataset.paid;

            if (!withdrawalId) {
                return;
            }

            const withdrawal = db.withdrawals.find(
                (item) => item.id === withdrawalId
            );

            if (!withdrawal) {
                return;
            }

            if (button.dataset.wapprove) {
                withdrawal.status = "approved";
            } else if (button.dataset.wreject) {
                withdrawal.status = "rejected";
            } else if (button.dataset.paid) {
                const confirmed = confirm("هل حوّلت المبلغ يدويًا إلى الشريك؟");

                if (!confirmed) {
                    return;
                }

                withdrawal.status = "paid";
            }

            saveData();
            renderAdminLists();
        });

        renderAdminLists();
    }
})();

/* ================================
DARK MODE
================================ */

(function () {
function initializeDarkMode() {
const toggle = document.getElementById("themeToggle");
const icon = document.getElementById("themeIcon");

    if (!toggle || !icon) return;

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.documentElement.classList.toggle("dark-mode", isDark);

        icon.textContent = isDark ? "☀️" : "🌙";

        toggle.setAttribute(
            "aria-label",
            isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"
        );

        toggle.setAttribute("title", "تغيير المظهر");

        try {
            localStorage.setItem("yazeed_theme", theme);
        } catch (error) {
            console.warn("Could not save the theme preference.");
        }
    }

    // Restore the saved theme when the page opens.
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("yazeed_theme") || "light";
    } catch (error) {
        // Use light mode if local storage is unavailable.
    }

    applyTheme(savedTheme);

    // Prevent duplicate click handlers.
    toggle.onclick = function () {
        const isDark =
            document.documentElement.classList.contains("dark-mode");

        applyTheme(isDark ? "light" : "dark");
    };
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDarkMode);
} else {
    initializeDarkMode();
}

})();
