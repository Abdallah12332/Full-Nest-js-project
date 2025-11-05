import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from "class-validator";

// ================= ADD REVIEW =================
export class AddReviewDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email of the user submitting the review",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Great product, highly recommended!",
    description: "User comment on the product",
  })
  @IsString()
  comment: string;

  @ApiProperty({
    example: "8f2e9f13-7d34-4c5a-95b1-5e5b3b5c1c9a",
    description: "UUID of the product being reviewed",
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: 4,
    description: "Rating between 1 and 5",
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

// ================= EDIT REVIEW =================
export class EditReviewDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email of the user editing the review",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "a14b5c3e-8e9f-4c2d-923b-34b7f26a1b2c",
    description: "UUID of the review to edit",
  })
  @IsUUID()
  reviewId: string;

  @ApiProperty({
    example: "Updated comment about the product",
    description: "Updated review text",
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    example: 5,
    description: "Updated rating between 1 and 5",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

// ================= REMOVE REVIEW =================
export class RemoveReviewDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email of the user removing the review",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "a14b5c3e-8e9f-4c2d-923b-34b7f26a1b2c",
    description: "UUID of the review to remove",
  })
  @IsUUID()
  reviewId: string;
}

// ================= ADD CART ITEM =================
export class AddCartItemDto {
  @ApiProperty({
    example: "7a2b8c4f-3c5d-4a6b-9e5f-12345abcde67",
    description: "UUID of the user's cart",
  })
  @IsUUID()
  cartId: string;

  @ApiProperty({
    example: "8f2e9f13-7d34-4c5a-95b1-5e5b3b5c1c9a",
    description: "UUID of the product to add to the cart",
  })
  @IsUUID()
  productId: string;
}

// ================= REMOVE CART ITEM =================
export class RemoveCartItemDto {
  @ApiProperty({
    example: "7a2b8c4f-3c5d-4a6b-9e5f-12345abcde67",
    description: "UUID of the user's cart",
  })
  @IsUUID()
  cartId: string;

  @ApiProperty({
    example: "8f2e9f13-7d34-4c5a-95b1-5e5b3b5c1c9a",
    description: "UUID of the product to remove from the cart",
  })
  @IsUUID()
  productId: string;
}

// ================= INCREASE QUANTITY =================
export class IncreaseQuantityDto {
  @ApiProperty({
    example: "3a5b9c8d-2e4f-4b6c-9a8f-34567f9e0b1a",
    description: "UUID of the cart item to increase quantity",
  })
  @IsUUID()
  cartItemId: string;
}

// ================= DECREASE QUANTITY =================
export class DecreaseQuantityDto {
  @ApiProperty({
    example: "3a5b9c8d-2e4f-4b6c-9a8f-34567f9e0b1a",
    description: "UUID of the cart item to decrease quantity",
  })
  @IsUUID()
  cartItemId: string;
}

// ================= SEARCH PRODUCTS =================
export class SearchProductsDto {
  @ApiProperty({
    example: "laptop",
    description: "Search keyword for product name or description",
    required: false,
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({
    example: 1,
    description: "Page number for pagination",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;
}

// ================= FIND PRODUCTS BY CATEGORY =================
export class FindProductsByCategoryDto {
  @ApiProperty({
    example: "electronics",
    description: "Category ID or name to filter products",
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: 2,
    description: "Page number for pagination",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;
}
