import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cart } from "../entities/Cart.entity";
import { User } from "../entities/User.entity";
import { Product } from "../entities/Product.entity";
import { Review } from "../entities/Review.entity";
import { CartItem } from "../entities/Cart_Item.entity";
import { CachService } from "../cach/cach.service";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly UserRepo: Repository<User>,
    @InjectRepository(Cart)
    private readonly CartRepo: Repository<Cart>,
    @InjectRepository(Product)
    private readonly ProductRepo: Repository<Product>,
    @InjectRepository(Review)
    private readonly ReviewRepo: Repository<Review>,
    @InjectRepository(CartItem)
    private readonly CartItemRepo: Repository<CartItem>,
    private cachService: CachService,
  ) {}
  async Add_Review(
    email: string,
    comment: string,
    productId: string,
    rating: number,
  ): Promise<string> {
    const user = await this.UserRepo.findOne({ where: { email: email } });
    if (!user || user.isVerified === false) {
      throw new NotFoundException("email not found");
    }
    const product = await this.ProductRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException("product not found");
    }
    const review = this.ReviewRepo.create({
      user: user,
      product: product,
      comment: comment,
      rating: rating,
    });
    await this.ReviewRepo.save(review);
    return "ok";
  }

  async Edit_Review(
    email: string,
    reviewId: string,
    comment?: string,
    rating?: number,
  ): Promise<string> {
    const review = await this.ReviewRepo.findOne({
      where: { id: reviewId },
      relations: ["user"],
    });
    if (!review) throw new NotFoundException("review not found");
    if (!review.user || review.user.email !== email)
      throw new NotFoundException("not authorized or review not found");

    const updated: Partial<Review> = {};
    if (typeof comment !== "undefined") updated.comment = comment;
    if (typeof rating !== "undefined") updated.rating = rating;

    await this.ReviewRepo.update({ id: reviewId }, updated);
    return "ok";
  }

  async Remove_Review(email: string, reviewId: string): Promise<string> {
    const review = await this.ReviewRepo.findOne({
      where: { id: reviewId },
      relations: ["user"],
    });
    if (!review) throw new NotFoundException("review not found");
    if (!review.user || review.user.email !== email)
      throw new NotFoundException("not authorized or review not found");

    await this.ReviewRepo.delete({ id: reviewId });
    return "ok";
  }
  async Add_Cart_Item(cartId: string, productId: string): Promise<string> {
    const cart = await this.CartRepo.findOneBy({ id: cartId });
    if (!cart) {
      throw new NotFoundException("cart not found");
    }
    const Product = await this.ProductRepo.findOneBy({ id: productId });
    if (!Product) {
      throw new NotFoundException("Product not found");
    }
    const cartItem = await this.CartItemRepo.findOne({
      where: { cart: { id: cartId }, product: { id: productId } },
      relations: ["cart", "product"],
    });
    if (cartItem) {
      throw new BadRequestException("Item already in cart");
    }
    const Cart_Item = this.CartItemRepo.create({
      quantity: 1,
      cart: cart,
      product: Product,
    });
    await this.CartItemRepo.save(Cart_Item);
    return "ok";
  }

  async Remove_Cart_Item(cartId: string, productId: string): Promise<string> {
    const cart = await this.CartRepo.findOneBy({ id: cartId });
    if (!cart) {
      throw new NotFoundException("cart not found");
    }
    const product = await this.ProductRepo.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const cartItem = await this.CartItemRepo.findOne({
      where: { cart: { id: cartId }, product: { id: productId } },
      relations: ["cart", "product"],
    });
    if (!cartItem) {
      throw new NotFoundException("cart item not found");
    }

    await this.CartItemRepo.remove(cartItem);
    return "ok";
  }
  async increase_Quantity(cartItemId: string): Promise<string> {
    const cartItem = await this.CartItemRepo.findOneBy({ id: cartItemId });
    if (!cartItem) {
      throw new NotFoundException("cartItem not found");
    }
    if (cartItem.quantity >= 999) {
      return "no";
    }
    cartItem.quantity++;
    await this.CartItemRepo.save(cartItem);
    return "ok";
  }
  async decrease_Quantity(cartItemId: string): Promise<string> {
    const cartItem = await this.CartItemRepo.findOneBy({ id: cartItemId });
    if (!cartItem) {
      throw new NotFoundException("cartItem not found");
    }
    if (cartItem.quantity <= 1) {
      return "no";
    }
    cartItem.quantity--;
    await this.CartItemRepo.save(cartItem);
    return "ok";
  }
  async SearchProducts(
    searchTerm: string,
    page: number,
  ): Promise<{ products: Product[]; currentPage: number; totalPages: number }> {
    try {
      const limit = 20;
      const skip = (Math.max(1, page) - 1) * limit;
      const cacheKey = `search:${searchTerm}:${page}`;
      const cached = await this.cachService.get<{
        products: Product[];
        currentPage: number;
        totalPages: number;
      }>(cacheKey);
      if (cached) return cached;

      const qb = this.ProductRepo.createQueryBuilder("product")
        .where("product.name LIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .orWhere("product.description LIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .leftJoinAndSelect("product.reviews", "reviews")
        .skip(skip)
        .take(limit);

      const [products, total] = await qb.getManyAndCount();
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const result = { products, currentPage: page, totalPages };
      await this.cachService.set(cacheKey, result);
      return result;
    } catch (err) {
      throw new Error("Failed to search products: " + err);
    }
  }
  async FindProductsByCategory(
    categoryId: string,
    page: number,
  ): Promise<{ products: Product[]; currentPage: number; totalPages: number }> {
    try {
      const limit = 20;
      const skip = (Math.max(1, page) - 1) * limit;
      const cachedKey = `category:${categoryId}:${page}`;
      const cached = await this.cachService.get<{
        products: Product[];
        currentPage: number;
        totalPages: number;
      }>(cachedKey);
      if (cached) return cached;
      const qb = this.ProductRepo.createQueryBuilder("product")
        .where("product.categoryId = :categoryId", { categoryId })
        .leftJoinAndSelect("product.reviews", "reviews")
        .skip(skip)
        .take(limit);

      const [products, total] = await qb.getManyAndCount();
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const result = { products, currentPage: page, totalPages };
      await this.cachService.set(cachedKey, result);
      return result;
    } catch (err) {
      throw new Error("Failed to fetch products by category: " + err);
    }
  }
}
