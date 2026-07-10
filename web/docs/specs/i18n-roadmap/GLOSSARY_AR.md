# 🌍 Glossaire AR BTP-MA — Round 2 Phase 6

> **Source de vérité terminologique arabe** pour Round 2 Phase 6 (traduction massive FR → AR de l'ERP Nafura).
> Variante : **MSA (Modern Standard Arabic)** — registre formel professionnel, adapté contexte BTP marocain.
> **Date de création** : 2026-05-29 par l'orchestrateur (agent `cursor-2026-05-29-R2-T1` reprend en mode append-only).
> **Convention** : append-only — chaque vague T2-T6 peut ajouter, jamais réécrire.

---

## ⚠️ Règles de traduction

1. **MSA professionnel** : pas de Coran, pas de dialecte marocain (DARIJA) sauf indication explicite.
2. **Acronymes administratifs MA préservés en latin** : `ICE`, `IF`, `RC`, `CNSS`, `AMO`, `RAS`, `TVA`, `IS`, `IR`, `BTP`, `BCC`, `AO`, `DA`, `BC`, `BL`, `BR`, `DGD`, `OS`, `IBAN`, `RIB`, `SWIFT`, `HSE`, `EPI`, `DUER`, `PPSPS`, `PHS`, `CAPA`, `GMAO`, `CGNC`. **Exception** : si l'arabe officiel est plus courant (ex : `TVA` → `الضريبة على القيمة المضافة` dans les libellés longs).
3. **Noms propres préservés** : `Nafura`, `Nafura ERP`, `Attijariwafa Bank`, `Maroc Telecom`. Les **villes marocaines** sont traduites en arabe (`Casablanca` → `الدار البيضاء`, `Rabat` → `الرباط`, `Marrakech` → `مراكش`, `Tanger` → `طنجة`, `Agadir` → `أكادير`).
4. **Devises et symboles MA** : `MAD` reste `MAD` (code ISO 4217) dans les colonnes/codes, mais `Dirham` → `درهم` en libellé long.
5. **Pluriels ICU** : utiliser les **6 formes arabes** dans `{count, plural, …}` : `zero` (0), `one` (1), `two` (2), `few` (3-10), `many` (11-99), `other` (≥ 100 ou cas par défaut). Cf. CLDR pour règles exactes.
6. **Ponctuation arabe** quand naturelle : `؟` (?), `،` (,), `؛` (;). Garder `.` `:` `()` `/` `-` `%` pour cohérence technique.
7. **Pas de tatweel décoratif** (`ـ`) ni de marqueurs LTR/RTL explicites (`U+200E/200F`) sauf cas particulier.

---

## 1. Actions UI universelles

| FR | AR | Notes |
|---|---|---|
| Save / Enregistrer | حفظ | |
| Cancel / Annuler | إلغاء | |
| Delete / Supprimer | حذف | |
| Edit / Modifier | تعديل | |
| View / Voir | عرض | |
| Confirm / Confirmer | تأكيد | |
| Validate / Valider | تحقق | |
| Reset / Réinitialiser | إعادة تعيين | |
| Refresh / Actualiser | تحديث | |
| Apply / Appliquer | تطبيق | |
| Close / Fermer | إغلاق | |
| Open / Ouvrir | فتح | |
| Add / Ajouter | إضافة | |
| Remove / Retirer | إزالة | |
| Submit / Soumettre | إرسال | |
| Search / Rechercher | بحث | |
| Filter / Filtrer | تصفية | |
| Sort / Trier | ترتيب | |
| Clear / Effacer | مسح | |
| Export / Exporter | تصدير | |
| Import / Importer | استيراد | |
| Print / Imprimer | طباعة | |
| Download / Télécharger | تحميل | |
| Upload / Téléverser | رفع | |
| Copy / Copier | نسخ | |
| Cut / Couper | قص | |
| Paste / Coller | لصق | |
| Duplicate / Dupliquer | تكرار | |
| Archive / Archiver | أرشفة | |
| Restore / Restaurer | استعادة | |
| Send / Envoyer | إرسال | |
| Receive / Recevoir | استلام | |
| Approve / Approuver | موافقة | |
| Reject / Rejeter | رفض | |
| Login / Se connecter | تسجيل الدخول | |
| Logout / Se déconnecter | تسجيل الخروج | |
| Loading… | جاري التحميل… | |
| Saving… | جاري الحفظ… | |
| Yes | نعم | |
| No | لا | |
| All / Tous | الكل | |
| None / Aucun | لا شيء | |
| Select / Sélectionner | اختيار | |
| Selected / Sélectionné | محدّد | |
| Show / Afficher | عرض | |
| Hide / Masquer | إخفاء | |
| Next / Suivant | التالي | |
| Previous / Précédent | السابق | |
| Back / Retour | رجوع | |
| Continue / Continuer | متابعة | |
| Finish / Terminer | إنهاء | |
| Settings / Paramètres | الإعدادات | |
| Help / Aide | مساعدة | |
| Profile / Profil | الملف الشخصي | |
| Notifications | الإشعارات | |
| More / Plus | المزيد | |
| Less / Moins | أقل | |
| Details / Détails | التفاصيل | |
| Summary / Résumé | الملخص | |

## 2. Statuts métier (workflow)

| FR | AR | Notes |
|---|---|---|
| Draft / Brouillon | مسودة | |
| Pending / En attente | قيد الانتظار | |
| In progress / En cours | قيد التنفيذ | |
| Submitted / Soumis | مقدم | |
| To approve / À approuver | بانتظار الموافقة | |
| Approved / Approuvé | موافق عليه | |
| Rejected / Rejeté | مرفوض | |
| Validated / Validé | مصدّق | |
| Posted / Comptabilisé | محاسب | |
| Cancelled / Annulé | ملغى | |
| Closed / Clôturé | مغلق | |
| Archived / Archivé | مؤرشف | |
| Active / Actif | نشط | |
| Inactive / Inactif | غير نشط | |
| Suspended / Suspendu | معلق | |
| Expired / Expiré | منتهي الصلاحية | |
| Open / Ouvert | مفتوح | |
| Published / Publié | منشور | |
| Unpublished / Non publié | غير منشور | |
| Completed / Terminé | مكتمل | |
| Failed / Échoué | فشل | |
| Success / Succès | نجاح | |
| Warning / Avertissement | تحذير | |
| Error / Erreur | خطأ | |
| Info / Information | معلومة | |

## 3. Entités BTP marocaines

| FR | AR | Notes |
|---|---|---|
| Chantier (jobsite) | ورش | Contexte BTP. `ورش البناء` si ambigu. |
| Marché (public contract) | عقد | `عقد عمومي` pour marché public. |
| Marché public | عقد عمومي | |
| Lot | دفعة | (« batch / parcel »). |
| Phase | مرحلة | |
| Tranche | شريحة | |
| Maître d'ouvrage (MOA) | صاحب المشروع | |
| Maître d'œuvre (MOE) | المهندس المعماري | Ou « المشرف على المشروع » dans certains contextes. |
| Sous-traitant | مقاول من الباطن | |
| Entreprise | مقاولة | |
| Devis | عرض أسعار | |
| Métré | كشف الكميات | |
| Bordereau des prix unitaires (BPU) | جدول الأسعار الوحدوية | |
| DPGF (Décomposition du Prix Global Forfaitaire) | تفصيل السعر الإجمالي الجزافي | |
| Ordre de service (OS) | أمر بالخدمة | |
| Décompte général définitif (DGD) | كشف عام نهائي | |
| Bon de commande (BC) | سند الطلب | |
| Bon de livraison (BL) | سند التسليم | |
| Bon de réception (BR) | سند الاستلام | |
| Demande d'achat (DA) | طلب شراء | |
| Appel d'offres (AO) | طلب عروض | |
| Bon de commande client (BCC) | سند طلب الزبون | |
| Offre | عرض | |
| Avenant | ملحق | |
| Caution | ضمان | |
| Cautionnement | كفالة | |
| Acompte | دفعة على الحساب | |
| Retenue de garantie | الضمان المحتجز | |
| Pénalité | غرامة | |
| Révision de prix | مراجعة الأسعار | |
| Attachement | مرفق | (chantier context) |
| Situation (de travaux) | كشف الأشغال | |
| Journal de chantier | يومية الورش | |

## 4. Finance / Comptabilité MA

| FR | AR | Notes |
|---|---|---|
| Journal | دفتر يومية | |
| Écriture comptable | قيد محاسبي | |
| Plan comptable | دليل الحسابات | |
| Compte | حساب | |
| Sous-compte | حساب فرعي | |
| Solde | رصيد | |
| Débit | مدين | |
| Crédit | دائن | |
| Lettrage | مطابقة | |
| Rapprochement bancaire | تسوية بنكية | |
| Balance | ميزان | |
| Bilan | الحصيلة المحاسبية | |
| Compte de résultat | حساب النتائج | |
| Facture | فاتورة | |
| Facture fournisseur (FF) | فاتورة المورد | |
| Facture client | فاتورة الزبون | |
| Avoir | إشعار دائن | |
| Règlement | تسديد | |
| Encaissement | تحصيل | |
| Virement | حوالة | |
| Caisse | صندوق | |
| Banque | بنك | |
| Trésorerie | الخزينة | |
| Mouvement de trésorerie | حركة الخزينة | |
| Condition de paiement | شروط الدفع | |
| Échéance | استحقاق | |
| Effet | كمبيالة | |
| Chèque | شيك | |
| Mode de règlement | طريقة التسديد | |
| Taux de change | سعر الصرف | |
| Devise | عملة | |
| Dirham marocain (MAD) | درهم مغربي | |
| Euro (EUR) | يورو | |
| Dollar (USD) | دولار | |
| TVA | الضريبة على القيمة المضافة | Acronyme `TVA` peut être préservé en latin selon contexte. |
| IS (Impôt sur les Sociétés) | الضريبة على الشركات | |
| IR (Impôt sur le Revenu) | الضريبة على الدخل | |
| Patente | الضريبة المهنية | |
| RAS (Retenue à la Source) | الاقتطاع من المنبع | |
| Déclaration fiscale | تصريح ضريبي | |
| ICE | معرّف الشركة | Acronyme `ICE` préservé en code, libellé long en arabe. |
| IF (Identifiant Fiscal) | الرقم الضريبي | |
| RC (Registre de Commerce) | السجل التجاري | |
| RIB | رقم الحساب البنكي | |
| IBAN | رقم الحساب البنكي الدولي | |
| Patente | الضريبة المهنية | |

## 5. RH / Paie MA

| FR | AR | Notes |
|---|---|---|
| Employé | موظف | |
| Salarié | أجير | |
| Cadre | إطار | |
| Chef d'équipe | رئيس فريق | |
| Ouvrier | عامل | |
| Manœuvre | عامل غير متخصص | |
| Salaire | راتب | |
| Rémunération | أجر | |
| Bulletin de paie | كشف الراتب | |
| Cotisation | اشتراك | |
| Retenue | اقتطاع | |
| Prime | علاوة | |
| Indemnité | تعويض | |
| Avance | سلفة | |
| Heure supplémentaire | ساعة إضافية | |
| Congé | إجازة | |
| Congé payé | إجازة مدفوعة الأجر | |
| Congé maladie | إجازة مرضية | |
| Congé maternité | إجازة الأمومة | |
| Congé paternité | إجازة الأبوة | |
| Absence | غياب | |
| Présence | حضور | |
| Pointage | الحضور | |
| Géofencing | تحديد النطاق الجغرافي | |
| CDI (Contrat à Durée Indéterminée) | عقد دائم | |
| CDD (Contrat à Durée Déterminée) | عقد محدد المدة | |
| CNSS (Caisse Nationale de Sécurité Sociale) | الصندوق الوطني للضمان الاجتماعي | Acronyme `CNSS` préservé. |
| AMO (Assurance Maladie Obligatoire) | التأمين الصحي الإجباري | |
| CIN (Carte d'Identité Nationale) | البطاقة الوطنية للتعريف | |
| Damancom | DAMANCOM | Plateforme officielle, préserver en latin. |
| Affiliation | انتساب | |
| Embauche | توظيف | |
| Démission | استقالة | |
| Licenciement | إقالة | |
| Visite médicale | الزيارة الطبية | |
| Médecine du travail | الطب الشغلي | |
| Aptitude | اللياقة | |

## 6. HSE / Sécurité chantier MA

| FR | AR | Notes |
|---|---|---|
| HSE (Hygiène-Sécurité-Environnement) | الصحة والسلامة والبيئة | Acronyme `HSE` souvent préservé. |
| EPI (Équipement de Protection Individuelle) | معدات الحماية الفردية | |
| DUER (Document Unique d'Évaluation des Risques) | وثيقة تقييم المخاطر | Acronyme `DUER` préservé. |
| PPSPS (Plan Particulier de Sécurité et de Protection de la Santé) | مخطط خاص بالسلامة والصحة | Acronyme `PPSPS` préservé. |
| PHS (Plan Hygiène et Sécurité) | مخطط الصحة والسلامة | |
| Accident du travail (AT) | حادث شغل | |
| Maladie professionnelle (MP) | مرض مهني | |
| Incident | حادث | |
| Presque-accident (near-miss) | شبه حادث | |
| Non-conformité (NC) | عدم المطابقة | |
| Action corrective | إجراء تصحيحي | |
| Action préventive | إجراء وقائي | |
| CAPA (Corrective Action / Preventive Action) | CAPA | Acronyme préservé. |
| Audit | تدقيق | |
| Inspection | فحص | |
| Formation | تكوين | |
| Habilitation | تأهيل | |
| Permis de travail | رخصة العمل | |
| Risque | خطر | |
| Gravité | درجة الخطورة | |
| Probabilité | الاحتمالية | |
| Fréquence | التكرار | |
| Investigation | تحقيق | |

## 7. Inventaire / Stock

| FR | AR | Notes |
|---|---|---|
| Article | صنف | |
| Catalogue | كاتالوغ | (loanword) |
| Famille | عائلة | |
| Catégorie | فئة | |
| Code-barres | الباركود | |
| Numéro de série | الرقم التسلسلي | |
| Lot | دفعة | |
| Stock | مخزون | |
| Entrepôt | مستودع | |
| Magasin | مخزن | |
| Magasin de chantier | مخزن الورش | |
| Réception | استلام | |
| Sortie | إخراج | |
| Transfert | تحويل | |
| Inventaire | جرد | |
| Perte / Casse | فقد | |
| Réservation | حجز | |
| Mouvement | حركة | |
| Valorisation | تقييم | |
| Méthode de coût (CMUP, FIFO, LIFO) | طريقة التكلفة | Acronymes préservés. |
| Quantité (Qté) | الكمية | |
| Unité de mesure (UoM) | وحدة القياس | |
| Seuil de réapprovisionnement | عتبة إعادة التموين | |
| Alerte de stock bas | تنبيه نقص المخزون | |

## 8. Géographie / Adresses

| FR | AR | Notes |
|---|---|---|
| Pays | البلد | |
| Région | الجهة | (admin MA). |
| Préfecture | العمالة | |
| Province | الإقليم | |
| Commune | الجماعة | |
| Ville | المدينة | |
| Quartier | الحي | |
| Adresse | العنوان | |
| Code postal | الرمز البريدي | |
| Casablanca | الدار البيضاء | |
| Rabat | الرباط | |
| Marrakech | مراكش | |
| Tanger | طنجة | |
| Agadir | أكادير | |
| Fès | فاس | |
| Meknès | مكناس | |
| Oujda | وجدة | |
| Tétouan | تطوان | |

## 9. Documents / Communication

| FR | AR | Notes |
|---|---|---|
| Document | وثيقة | |
| Pièce jointe | مرفق | |
| Fichier | ملف | |
| Photo | صورة | |
| Signature | توقيع | |
| Tampon | ختم | |
| Rapport | تقرير | |
| Procès-verbal (PV) | محضر | |
| Notification | إشعار | |
| Email / Courriel | بريد إلكتروني | |
| SMS | رسالة قصيرة | |
| WhatsApp | واتساب | |
| Téléphone | هاتف | |
| Mobile | محمول | |
| Fax | فاكس | |

## 10. Temps / Périodes

| FR | AR | Notes |
|---|---|---|
| Jour | يوم | |
| Semaine | أسبوع | |
| Mois | شهر | |
| Trimestre | فصل | |
| Année | سنة | |
| Aujourd'hui | اليوم | |
| Hier | أمس | |
| Demain | غدا | |
| Maintenant | الآن | |
| Date | تاريخ | |
| Heure | ساعة | |
| Période | فترة | |
| Échéance | استحقاق | |
| Date de début | تاريخ البدء | |
| Date de fin | تاريخ الانتهاء | |
| Durée | مدة | |
| Lundi | الإثنين | |
| Mardi | الثلاثاء | |
| Mercredi | الأربعاء | |
| Jeudi | الخميس | |
| Vendredi | الجمعة | |
| Samedi | السبت | |
| Dimanche | الأحد | |
| Janvier | يناير | |
| Février | فبراير | |
| Mars | مارس | |
| Avril | أبريل | |
| Mai | ماي | |
| Juin | يونيو | |
| Juillet | يوليوز | |
| Août | غشت | |
| Septembre | شتنبر | |
| Octobre | أكتوبر | |
| Novembre | نونبر | |
| Décembre | دجنبر | |

## 11. Validation / Messages d'erreur

| FR | AR | Notes |
|---|---|---|
| Ce champ est obligatoire | هذا الحقل إلزامي | |
| Valeur invalide | قيمة غير صالحة | |
| Format incorrect | تنسيق غير صحيح | |
| Email invalide | بريد إلكتروني غير صالح | |
| Date invalide | تاريخ غير صالح | |
| Minimum requis | الحد الأدنى المطلوب | |
| Maximum autorisé | الحد الأقصى المسموح | |
| Une erreur est survenue | حدث خطأ | |
| Opération réussie | تمت العملية بنجاح | |
| Êtes-vous sûr ? | هل أنت متأكد؟ | |
| Cette action est irréversible | هذا الإجراء لا يمكن التراجع عنه | |
| Voulez-vous continuer ? | هل تريد المتابعة؟ | |

## 12. Approbations / Workflow

| FR | AR | Notes |
|---|---|---|
| Demande d'approbation | طلب موافقة | |
| Approbateur | الموافق | |
| Demandeur | الطالب | |
| Workflow | سير العمل | |
| Étape | مرحلة | |
| Niveau | مستوى | |
| Délégation | تفويض | |
| Inbox / Boîte de réception | علبة الوصول | |
| Historique | السجل | |
| Audit log | سجل التدقيق | |

---

## 📝 Règles de contribution (T2-T6)

- **Append-only** : ajouter en bas de section ou créer une nouvelle section. Ne pas réécrire les entrées existantes.
- Si une traduction est ambiguë : commenter dans la cellule « Notes » avec contexte.
- Si l'acronyme MA est mieux préservé en latin : indique-le explicitement.
- Si tu introduis un terme nouveau utilisé dans ≥ 3 packs : ajoute-le ici.

---

> Document maintenu par les vagues `R2-T1` → `R2-T6`. Toute extension reflétée dans `00-PROGRESS.md`.
