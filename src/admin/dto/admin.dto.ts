import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
} from "class-validator";
import { User } from "../../entities/User.entity";
import { Product } from "../../entities/Product.entity";
import { Type } from "class-transformer";

// ================= FIND LIMIT =================
export class FindLimitDto {
  @ApiProperty({
    example: 10,
    description: "Number of items to take (limit)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  take: number;

  @ApiProperty({
    example: 0,
    description: "Number of items to skip (offset)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number;
}

// ================= UPDATE USER =================
export class UpdateUserDto {
  @ApiProperty({
    example: "2d9f9c3e-b8c4-4f56-8a2f-23d84b15b9f5",
    description: "UUID of the user to update",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Partial user data to update",
    type: () => User,
    required: false,
  })
  @IsOptional()
  updated_User: User;
}

// ================= UPDATE PRODUCT =================
export class UpdateProductDto {
  @ApiProperty({
    example: "9e8a1b64-3f24-4c54-ae13-cc1fd6d8a6f0",
    description: "UUID of the product to update",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Partial product data to update",
    type: () => Product,
    required: false,
  })
  @IsOptional()
  updatedProduct: Product;
}

// ================= CREATE PRODUCT =================
export class CreateProductDto {
  @ApiProperty({
    example: "Wireless Mouse",
    description: "Name of the product",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "High-precision wireless mouse with ergonomic design",
    description: "Product description",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 49.99,
    description: "Product price",
  })
  @IsInt()
  price: number;

  @ApiProperty({
    example: 100,
    description: "Available stock quantity",
  })
  @IsInt()
  stock: number;

  @ApiProperty({
    example: "Extra info about materials or specifications",
    description: "Additional product details",
    required: false,
  })
  @IsOptional()
  more_description?: string;

  @ApiProperty({
    example: "electronics",
    description: "Category ID or name (optional)",
    required: false,
  })
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    example: ["image1.jpg", "image2.jpg"],
    description: "Array of product image URLs",
    required: false,
  })
  @IsOptional()
  images?: string[];
}

// ================= FIND BY ID =================
export class FindIdDto {
  @ApiProperty({
    example: "2f8d4a5b-7b41-4c5e-b70b-6d7ffeb7f437",
    description: "UUID of the entity to find",
  })
  @IsUUID()
  id: string;
}

// ================= GET LOG =================
export class GetLogDto {
  @ApiProperty({
    example: 20,
    description: "Number of log entries to take",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  take: number;

  @ApiProperty({
    example: 0,
    description: "Number of log entries to skip",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number;
}
