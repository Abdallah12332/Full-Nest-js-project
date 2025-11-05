import { Controller, Post, Body, UseGuards, Get, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import {
  AddReviewDto,
  EditReviewDto,
  RemoveReviewDto,
  AddCartItemDto,
  RemoveCartItemDto,
  IncreaseQuantityDto,
  DecreaseQuantityDto,
  FindProductsByCategoryDto,
  SearchProductsDto,
} from "./dto/user.dto";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Product } from "../entities/Product.entity";
import { ApiResponse, PaginatedResponse } from "../common/dto/response.dto";

@Controller("user")
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class UserController {
  constructor(private readonly UserService: UserService) {}
  @Post("Add_Review")
  async Add_Review(@Body() dto: AddReviewDto): Promise<ApiResponse> {
    await this.UserService.Add_Review(
      dto.email,
      dto.comment,
      dto.productId,
      dto.rating,
    );
    return ApiResponse.success("Review added successfully");
  }
  @Post("Edit_Review")
  async Edit_Review(@Body() dto: EditReviewDto): Promise<ApiResponse> {
    await this.UserService.Edit_Review(
      dto.email,
      dto.reviewId,
      dto.comment,
      dto.rating,
    );
    return ApiResponse.success("Review updated successfully");
  }

  @Post("Remove_Review")
  async Remove_Review(@Body() dto: RemoveReviewDto): Promise<ApiResponse> {
    await this.UserService.Remove_Review(dto.email, dto.reviewId);
    return ApiResponse.success("Review removed successfully");
  }
  @Post("Add_Cart_Item")
  async Add_Cart_Item(@Body() dto: AddCartItemDto): Promise<ApiResponse> {
    await this.UserService.Add_Cart_Item(dto.cartId, dto.productId);
    return ApiResponse.success("Item added to cart successfully");
  }
  @Post("Remove_Cart_Item")
  async Remove_Cart_Item(@Body() dto: RemoveCartItemDto): Promise<ApiResponse> {
    await this.UserService.Remove_Cart_Item(dto.cartId, dto.productId);
    return ApiResponse.success("Item removed from cart successfully");
  }
  @Post("increase_Quantity")
  async increase_Quantity(
    @Body() dto: IncreaseQuantityDto,
  ): Promise<ApiResponse> {
    await this.UserService.increase_Quantity(dto.cartItemId);
    return ApiResponse.success("Quantity increased successfully");
  }
  @Post("decrease_Quantity")
  async decrease_Quantity(
    @Body() dto: DecreaseQuantityDto,
  ): Promise<ApiResponse> {
    await this.UserService.decrease_Quantity(dto.cartItemId);
    return ApiResponse.success("Quantity decreased successfully");
  }
  @Get("products_search/")
  async SearchProducts(
    @Query() query: SearchProductsDto,
  ): Promise<PaginatedResponse<Product>> {
    const searchTerm = query.searchTerm ?? "";
    const p = query.page ? Number(query.page) : 1;
    const result = await this.UserService.SearchProducts(searchTerm, p);
    return new PaginatedResponse(
      "Products retrieved successfully",
      result.products,
      result.currentPage,
      result.totalPages,
      result.products.length,
      10, // itemsPerPage - you may need to adjust this based on your service
    );
  }
  @Get("ProductCategory/")
  async FindProductsByCategory(
    @Query() query: FindProductsByCategoryDto,
  ): Promise<PaginatedResponse<Product>> {
    const p = query.page ? Number(query.page) : 1;
    const result = await this.UserService.FindProductsByCategory(
      query.categoryId,
      p,
    );
    return new PaginatedResponse(
      "Products retrieved successfully",
      result.products,
      result.currentPage,
      result.totalPages,
      result.products.length,
      10, // itemsPerPage - you may need to adjust this based on your service
    );
  }
}
