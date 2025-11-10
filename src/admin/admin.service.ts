import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cart } from "../entities/Cart.entity";
import { User } from "../entities/User.entity";
import { Product } from "../entities/Product.entity";
import { Review } from "../entities/Review.entity";
import { Repository } from "typeorm";
import { CartItem } from "../entities/Cart_Item.entity";
import { CachService } from "../cach/cach.service";

@Injectable()
export class AdminService {
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
    private readonly CartItem: Repository<CartItem>,
    private CachService: CachService,
  ) {}
  async FindLimitUser(take: number, skip: number): Promise<User[]> {
    try {
      const cached_key = `users:${take + "" + skip}`;
      const cached = await this.CachService.get<User[]>(cached_key);
      if (cached) return cached;
      const users = await this.UserRepo.find({ skip: skip, take: take });
      await this.CachService.set(cached_key, users);
      return users;
    } catch (err) {
      throw new Error("Failed to create user: " + err);
    }
  }

  async FindUser(id: string): Promise<User> {
    try {
      const cached_key = `user:${id}`;
      const cached = await this.CachService.get<User>(cached_key);
      if (cached) return cached;
      const user = await this.UserRepo.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      await this.CachService.set(cached_key, user);
      return user;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new Error("Failed to create user: " + err);
    }
  }

  async CreateUser(userData: User): Promise<User> {
    try {
      const user = this.UserRepo.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        provider: userData.provider || "local",
        role: userData.role,
        isVerified: userData.isVerified,
        googleId: userData.googleId,
      });
      const savedUser = await this.UserRepo.save(user);

      const cart = this.CartRepo.create({
        user: savedUser,
      });
      await this.CartRepo.save(cart);
      return savedUser;
    } catch (err) {
      throw new Error("Failed to create user: " + err);
    }
  }

  async UpdateUser(id: string, updated_User: Partial<User>): Promise<string> {
    try {
      const user = await this.UserRepo.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      await this.UserRepo.update(id, updated_User);
      return "ok";
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new Error("Failed to Update user: " + err);
    }
  }

  async DeleteUser(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException("id is required");
    }
    const user = await this.UserRepo.findOne({
      where: { id: id },
      relations: ["orders", "cart", "reviews"],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    await this.UserRepo.remove(user);
    return "the user deleted";
  }

  // Product operations
  async FindLimitProducts(take: number, skip: number): Promise<Product[]> {
    try {
      const cached_key = `products:${take + " " + skip}`;
      const cached = await this.CachService.get<Product[]>(cached_key);
      if (cached) return cached;
      const products = await this.ProductRepo.find({
        skip: skip,
        take: take,
        relations: ["reviews"],
      });
      await this.CachService.set(cached_key, products);

      return products;
    } catch (err) {
      throw new Error("Failed to fetch products: " + err);
    }
  }

  async FindProduct(id: string): Promise<Product> {
    try {
      const cached_key = `product:${id}`;
      const cached = await this.CachService.get<Product>(cached_key);
      if (cached) return cached;
      const product = await this.ProductRepo.findOne({
        where: { id },
        relations: ["reviews"],
      });
      if (!product) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      await this.CachService.set(cached_key, product);

      return product;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException("Failed to fetch product");
    }
  }

  async CreateProduct(productData: Partial<Product>): Promise<Product> {
    try {
      if (
        !productData.name ||
        !productData.description ||
        !productData.price ||
        !productData.stock
      ) {
        throw new BadRequestException(
          "Name, description, price, and stock are required",
        );
      }

      const product = this.ProductRepo.create({
        name: productData.name,
        description: productData.description,
        more_description: productData.more_description,
        price: productData.price,
        stock: productData.stock,
        categoryId: productData.categoryId,
        images: productData.images || [],
      });

      const savedProduct = await this.ProductRepo.save(product);
      return savedProduct;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new Error("Failed to create product: " + err);
    }
  }

  async UpdateProduct(
    id: string,
    updatedProduct: Partial<Product>,
  ): Promise<string> {
    try {
      if (!id) {
        throw new BadRequestException("Product ID is required");
      }

      const product = await this.ProductRepo.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      await this.ProductRepo.update(id, updatedProduct);
      return "Product updated successfully";
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new Error("Failed to update product: " + err);
    }
  }

  async DeleteProduct(id: string): Promise<string> {
    try {
      if (!id) {
        throw new BadRequestException("Product ID is required");
      }

      const product = await this.ProductRepo.findOne({
        where: { id },
        relations: ["reviews", "cartItems"],
      });

      if (!product) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      await this.ProductRepo.remove(product);
      return "Product deleted successfully";
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new Error("Failed to delete product: " + err);
    }
  }
  async Find_Cart(id: string): Promise<Cart> {
    const cached_key = `cart:${id}`;
    const cached = await this.CachService.get<Cart>(cached_key);
    if (cached) return cached;
    const cart = await this.CartRepo.findOneBy({ id });
    if (!cart) {
      throw new NotFoundException("cart not found");
    }
    await this.CachService.set(cached_key, cart);

    return cart;
  }
  async Find_CartItem(id: string): Promise<CartItem> {
    const cached_key = `cartitem:${id}`;
    const cached = await this.CachService.get<CartItem>(cached_key);
    if (cached) return cached;
    const cartItem = await this.CartItem.findOneBy({ id });
    if (!cartItem) {
      throw new NotFoundException("no cart Item");
    }
    await this.CachService.set(cached_key, cartItem);

    return cartItem;
  }
}
