import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Put,
  Get,
  UseGuards,
  Query,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { User } from "../entities/User.entity";
import { Product } from "../entities/Product.entity";
import {
  FindLimitDto,
  UpdateUserDto,
  CreateProductDto,
  UpdateProductDto,
  FindIdDto,
  GetLogDto,
} from "./dto/admin.dto";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { Cart } from "../entities/Cart.entity";
import { CartItem } from "../entities/Cart_Item.entity";
import { ThrottlerGuard } from "@nestjs/throttler";
import { LogService } from "../log/log.service";
import { ApiResponse } from "../common/dto/response.dto";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from "@nestjs/swagger";

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard, ThrottlerGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin_service: AdminService,
    private readonly logservice: LogService,
  ) {}

  // ===================== USERS =====================
  @Get("findLimit")
  @ApiOperation({ summary: "Retrieve a paginated list of users" })
  @ApiQuery({
    name: "take",
    type: Number,
    example: 10,
    description: "Number of users to take",
  })
  @ApiQuery({
    name: "skip",
    type: Number,
    example: 0,
    description: "Number of users to skip",
  })
  @SwaggerResponse({
    status: 200,
    description: "Users retrieved successfully",
    type: User,
  })
  async FindLimitUser(
    @Query() dto: FindLimitDto,
  ): Promise<ApiResponse<User[]>> {
    const users = await this.admin_service.FindLimitUser(dto.take, dto.skip);
    return ApiResponse.success("Users retrieved successfully", users);
  }

  @Get("findone/:id")
  @ApiOperation({ summary: "Retrieve a user by ID" })
  @ApiParam({ name: "id", example: "9d8c6f2a-ec71-4f24-b5b7-9a21455c2133" })
  @SwaggerResponse({
    status: 200,
    description: "User retrieved successfully",
    type: User,
  })
  @SwaggerResponse({ status: 404, description: "User not found" })
  async FindUser(@Param("id") id: string): Promise<ApiResponse<User>> {
    const user = await this.admin_service.FindUser(id);
    return ApiResponse.success("User retrieved successfully", user);
  }

  @Post("Createone")
  @ApiOperation({ summary: "Create a new user" })
  @ApiBody({ type: User, description: "User data object" })
  @SwaggerResponse({
    status: 201,
    description: "User created successfully",
    type: User,
  })
  @SwaggerResponse({ status: 400, description: "Invalid user data" })
  async CreateUser(@Body() userData: User): Promise<ApiResponse<User>> {
    const user = await this.admin_service.CreateUser(userData);
    return ApiResponse.success("User created successfully", user);
  }

  @Put("Updateone")
  @ApiOperation({ summary: "Update an existing user" })
  @ApiBody({ type: UpdateUserDto, description: "Updated user data" })
  @SwaggerResponse({ status: 200, description: "User updated successfully" })
  @SwaggerResponse({ status: 404, description: "User not found" })
  async UpdateUser(@Body() dto: UpdateUserDto): Promise<ApiResponse> {
    await this.admin_service.UpdateUser(dto.id, dto.updated_User);
    return ApiResponse.success("User updated successfully");
  }

  @Delete("Deleteone/:id")
  @ApiOperation({ summary: "Delete a user by ID" })
  @ApiParam({ name: "id", example: "3b4d4a1e-bc25-4c8d-8f29-11e40a7d8c33" })
  @SwaggerResponse({ status: 200, description: "User deleted successfully" })
  @SwaggerResponse({ status: 404, description: "User not found" })
  async DeleteUser(@Param("id") id: string): Promise<ApiResponse> {
    await this.admin_service.DeleteUser(id);
    return ApiResponse.success("User deleted successfully");
  }

  // ===================== PRODUCTS =====================
  @Get("limitProducts")
  @ApiOperation({ summary: "Retrieve a paginated list of products" })
  @ApiQuery({
    name: "take",
    type: Number,
    example: 10,
    description: "Number of products to take",
  })
  @ApiQuery({
    name: "skip",
    type: Number,
    example: 0,
    description: "Number of products to skip",
  })
  @SwaggerResponse({
    status: 200,
    description: "Products retrieved successfully",
    type: [Product],
  })
  async FindLimitProducts(
    @Query() dto: FindLimitDto,
  ): Promise<ApiResponse<Product[]>> {
    const products = await this.admin_service.FindLimitProducts(
      dto.take,
      dto.skip,
    );
    return ApiResponse.success("Products retrieved successfully", products);
  }

  @Get("find_one_product/:id")
  @ApiOperation({ summary: "Retrieve a product by ID" })
  @ApiParam({ name: "id", example: "c5a3b3f7-987d-47bb-b5dc-81c2d57d1234" })
  @SwaggerResponse({
    status: 200,
    description: "Product retrieved successfully",
    type: Product,
  })
  @SwaggerResponse({ status: 404, description: "Product not found" })
  async FindProduct(@Param("id") id: string): Promise<ApiResponse<Product>> {
    const product = await this.admin_service.FindProduct(id);
    return ApiResponse.success("Product retrieved successfully", product);
  }

  @Post("createProduct")
  @ApiOperation({ summary: "Create a new product" })
  @ApiBody({ type: CreateProductDto, description: "Product data object" })
  @SwaggerResponse({
    status: 201,
    description: "Product created successfully",
    type: Product,
  })
  @SwaggerResponse({ status: 400, description: "Invalid product data" })
  async CreateProduct(
    @Body() productData: CreateProductDto,
  ): Promise<ApiResponse<Product>> {
    const product = await this.admin_service.CreateProduct(productData);
    return ApiResponse.success("Product created successfully", product);
  }

  @Put("update_Product")
  @ApiOperation({ summary: "Update an existing product" })
  @ApiBody({ type: UpdateProductDto, description: "Updated product data" })
  @SwaggerResponse({ status: 200, description: "Product updated successfully" })
  @SwaggerResponse({ status: 404, description: "Product not found" })
  async UpdateProduct(@Body() dto: UpdateProductDto): Promise<ApiResponse> {
    await this.admin_service.UpdateProduct(dto.id, dto.updatedProduct);
    return ApiResponse.success("Product updated successfully");
  }

  @Delete("delete_Product/:id")
  @ApiOperation({ summary: "Delete a product by ID" })
  @ApiParam({ name: "id", example: "8d3b7a4f-6a2e-4a1a-9c8a-17c7e8a5f233" })
  @SwaggerResponse({ status: 200, description: "Product deleted successfully" })
  @SwaggerResponse({ status: 404, description: "Product not found" })
  async DeleteProduct(@Param("id") id: string): Promise<ApiResponse> {
    await this.admin_service.DeleteProduct(id);
    return ApiResponse.success("Product deleted successfully");
  }

  // ===================== CART =====================
  @Get("find_cart")
  @ApiOperation({ summary: "Retrieve a cart by ID" })
  @ApiQuery({ name: "id", example: "b8d5f3e4-8c7d-47a1-b7e5-5a2bca91e7a9" })
  @SwaggerResponse({
    status: 200,
    description: "Cart retrieved successfully",
    type: Cart,
  })
  @SwaggerResponse({ status: 404, description: "Cart not found" })
  async Find_Cart(@Query() dto: FindIdDto): Promise<ApiResponse<Cart>> {
    const cart = await this.admin_service.Find_Cart(dto.id);
    return ApiResponse.success("Cart retrieved successfully", cart);
  }

  @Get("find_cartItem")
  @ApiOperation({ summary: "Retrieve a cart item by ID" })
  @ApiQuery({ name: "id", example: "2a3f7b1c-4c9d-4b3e-8a2b-11d3f9b8e6f0" })
  @SwaggerResponse({
    status: 200,
    description: "Cart item retrieved successfully",
    type: CartItem,
  })
  @SwaggerResponse({ status: 404, description: "Cart item not found" })
  async Find_CartItem(@Query() dto: FindIdDto): Promise<ApiResponse<CartItem>> {
    const cartItem = await this.admin_service.Find_CartItem(dto.id);
    return ApiResponse.success("Cart item retrieved successfully", cartItem);
  }

  // ===================== LOGS =====================
  @Get("getLog")
  @ApiOperation({ summary: "Retrieve application logs with pagination" })
  @ApiQuery({
    name: "take",
    example: 20,
    description: "Number of logs to take",
  })
  @ApiQuery({ name: "skip", example: 0, description: "Number of logs to skip" })
  @SwaggerResponse({ status: 200, description: "Logs retrieved successfully" })
  async getlog(@Query() dto: GetLogDto): Promise<ApiResponse> {
    const logs = await this.logservice.getlog(dto.take, dto.skip);
    return ApiResponse.success("Logs retrieved successfully", logs);
  }
}
