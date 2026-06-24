# Auth + Account Wireframes (Mobile)

## Auth

## 1) login

```
+------------------------------------------------+
| Header back                                    |
| Title: Se connecter                            |
|------------------------------------------------|
| Email / phone input                            |
| Password input                                 |
| Forgot password link                            |
|------------------------------------------------|
| CTA primary: Se connecter                      |
| CTA secondary: Continuer avec OTP              |
| Link: Creer un compte                          |
+------------------------------------------------+
```

Notes:
- keep returnTo when redirected from payment
- show inline errors for invalid credentials

## 2) register

```
+------------------------------------------------+
| Header back                                    |
| Title: Creer un compte                         |
|------------------------------------------------|
| First name | Last name                         |
| Email | Phone                                  |
| Password | Confirm password                    |
| checkbox terms                                 |
|------------------------------------------------|
| CTA primary: Creer mon compte                  |
| Link: J'ai deja un compte                      |
+------------------------------------------------+
```

---

## Account

## 3) customer-bookings

```
+------------------------------------------------+
| Header title: Mes reservations                 |
| Tabs: A venir | Passees                        |
|------------------------------------------------|
| [Booking card]
| venue/event, date/time, status badge           |
| actions: details | support                      |
|------------------------------------------------|
| [Booking card]                                 |
+------------------------------------------------+
```

States:
- empty upcoming
- empty past
- error retry

## 4) customer-profile

```
+------------------------------------------------+
| Header title: Mon profil                       |
|------------------------------------------------|
| Avatar + change photo                          |
| First name | Last name                         |
| Email (read only + change link)                |
| Phone                                           |
| Preferred city                                  |
| Language selector                               |
| Marketing opt-in toggle                         |
|------------------------------------------------|
| CTA primary: Enregistrer                        |
| CTA secondary: Se deconnecter                   |
| Danger zone: Supprimer mon compte               |
+------------------------------------------------+
```

Validation notes:
- phone E.164
- email not editable directly
- delete account requires strong confirm

## Global account/auth states
- loading skeleton
- empty when list has no items
- error with retry
- success
