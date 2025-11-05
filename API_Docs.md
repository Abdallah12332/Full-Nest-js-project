# Portfolio API Documentation

## Overview

This API is built using **NestJS** and provides endpoints for user authentication, product management, cart operations, reviews, and admin operations. Authentication uses JWT tokens.

---

## Base URL

`https://your-api-domain.com`

---

## Authentication Endpoints

### `POST /auth/half-register`

Start partial registration.  
Request body: `RegisterHalfDto` (email)

### `POST /auth/full_register`

Complete registration with code.  
Request body: `RegisterFullDto` (email, code)

### `POST /auth/complete_register`

Finalize registration with password.  
Request body: `RegisterCompleteDto` (email, password)

### `POST /auth/login`

User login.  
Request body: `LoginDto` (email, password)

### `POST /auth/log_out`

Log out user.  
Request body: `LogOutDto` (email)

### `POST /auth/password-reset-request`

Request password reset.  
Request body: `PasswordResetRequestDto` (email)

### `POST /auth/password-reset-confirm`

Confirm password reset.  
Request body: `PasswordResetConfirmDto` (email, token, newPassword)

### `GET /auth/callback/google`

Google OAuth callback.

### `POST /auth/update_token`

Update JWT token.

### `POST /auth/csrf`

Get CSRF token.

---

## User Endpoints

### Reviews

- `POST /user/Add_Review` → Add review (`AddReviewDto`)
- `POST /user/Edit_Review` → Edit review (`EditReviewDto`)
- `POST /user/Remove_Review` → Remove review (`RemoveReviewDto`)

### Cart

- `POST /user/Add_Cart_Item` → Add item (`AddCartItemDto`)
- `POST /user/Remove_Cart_Item` → Remove item (`RemoveCartItemDto`)
- `POST /user/increase_Quantity` → Increase item quantity (`IncreaseQuantityDto`)
- `POST /user/decrease_Quantity` → Decrease item quantity (`DecreaseQuantityDto`)

### Products

- `GET /user/products_search` → Search products (query: searchTerm, page)
- `GET /user/ProductCategory` → Filter products by category (query: categoryId, page)

---

## Admin Endpoints

### Users

- `GET /admin/findLimit` → Paginated list (query: take, skip)
- `GET /admin/findone/{id}` → Get user by ID
- `POST /admin/Createone` → Create user
- `PUT /admin/Updateone` → Update user
- `DELETE /admin/Deleteone/{id}` → Delete user

### Products

- `GET /admin/limitProducts` → Paginated list of products
- `GET /admin/find_one_product/{id}` → Get product by ID
- `POST /admin/createProduct` → Create product
- `PUT /admin/update_Product` → Update product
- `DELETE /admin/delete_Product/{id}` → Delete product

### Cart

- `GET /admin/find_cart` → Get cart by ID
- `GET /admin/find_cartItem` → Get cart item by ID

### Logs

- `GET /admin/getLog` → Paginated logs (query: take, skip)

---

## Models (Schemas)

### User

Empty object, extendable for user properties.

### Product

Empty object, extendable for product properties.

### Cart / CartItem

Empty object, extendable.

### DTOs

- `UpdateUserDto`, `CreateProductDto`, `UpdateProductDto`
- `RegisterHalfDto`, `RegisterFullDto`, `RegisterCompleteDto`
- `LoginDto`, `LogOutDto`, `PasswordResetRequestDto`, `PasswordResetConfirmDto`
- `AddReviewDto`, `EditReviewDto`, `RemoveReviewDto`
- `AddCartItemDto`, `RemoveCartItemDto`, `IncreaseQuantityDto`, `DecreaseQuantityDto`

---

## Security

- JWT bearer token required for protected endpoints (`securitySchemes: bearer`).

---

## Notes

- Some endpoints require authentication (`bearer token`).
- Pagination uses `take` and `skip` query parameters.
- Use UUIDs for IDs when required.
