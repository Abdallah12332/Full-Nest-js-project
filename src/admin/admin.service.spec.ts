import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { Cart } from "../entities/Cart.entity";
import { Product } from "../entities/Product.entity";
import { Review } from "../entities/Review.entity";
import { CartItem } from "../entities/Cart_Item.entity";
import { ObjectLiteral, Repository } from "typeorm";
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { CachService } from "../cach/cach.service";

type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

const repositoryMockFactory = <T extends ObjectLiteral = any>(): MockType<
  Repository<T>
> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe("AdminService", () => {
  let moduleRef: TestingModule;
  let service: AdminService;
  let userRepo: MockType<Repository<User>>;
  let cartRepo: MockType<Repository<Cart>>;
  let productRepo: MockType<Repository<Product>>;
  let cartItemRepo: MockType<Repository<CartItem>>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        AdminService,
        CachService,
        {
          provide: getRepositoryToken(User),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Cart),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Product),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Review),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(CartItem),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = moduleRef.get<AdminService>(AdminService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    cartRepo = moduleRef.get(getRepositoryToken(Cart));
    productRepo = moduleRef.get(getRepositoryToken(Product));
    cartItemRepo = moduleRef.get(getRepositoryToken(CartItem));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("FindLimitUser", () => {
    it("should return users based on take and skip", async () => {
      const mockUsers: User[] = [
        { id: "1", name: "User1" } as User,
        { id: "2", name: "User2" } as User,
      ];
      (userRepo.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.FindLimitUser(2, 0);
      expect(result).toEqual(mockUsers);
      expect(userRepo.find).toHaveBeenCalledWith({ skip: 0, take: 2 });
    });

    it("should throw an error if find fails", async () => {
      (userRepo.find as jest.Mock).mockRejectedValue(new Error("DB error"));
      await expect(service.FindLimitUser(2, 0)).rejects.toThrow(
        "Failed to create user: Error: DB error",
      );
    });
  });

  describe("FindUser", () => {
    it("should return a user if found", async () => {
      const mockUser: User = { id: "1", name: "User1" } as User;
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.FindUser("1");
      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: "1" } });
    });

    it("should throw NotFoundException if user not found", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.FindUser("1")).rejects.toThrow(NotFoundException);
    });

    it("should throw an error if findOne fails", async () => {
      (userRepo.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));
      await expect(service.FindUser("1")).rejects.toThrow(
        "Failed to create user: Error: DB error",
      );
    });
  });

  describe("CreateUser", () => {
    it("should create a user and a cart", async () => {
      const userData: User = {
        name: "User1",
        email: "user1@example.com",
        password: "pass123",
        provider: "local",
        role: "user",
        isVerified: true,
        googleId: null,
      } as unknown as User;

      const createdUser: User = { ...userData, id: "1" } as User;
      const createdCart: Cart = { id: "1", user: createdUser } as Cart;

      (userRepo.create as jest.Mock).mockReturnValue(userData);
      (userRepo.save as jest.Mock).mockResolvedValue(createdUser);
      (cartRepo.create as jest.Mock).mockReturnValue({ user: createdUser });
      (cartRepo.save as jest.Mock).mockResolvedValue(createdCart);

      const result = await service.CreateUser(userData);

      expect(result).toEqual(createdUser);
      expect(userRepo.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        provider: userData.provider,
        role: userData.role,
        isVerified: userData.isVerified,
        googleId: userData.googleId,
      });
      expect(userRepo.save).toHaveBeenCalledWith(userData);
      expect(cartRepo.create).toHaveBeenCalledWith({ user: createdUser });
      expect(cartRepo.save).toHaveBeenCalledWith({ user: createdUser });
    });

    it("should throw an error if UserRepo.save fails", async () => {
      const userData: User = { name: "User1" } as User;
      (userRepo.create as jest.Mock).mockReturnValue(userData);
      (userRepo.save as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(service.CreateUser(userData)).rejects.toThrow(
        "Failed to create user: Error: DB error",
      );
    });

    it("should throw an error if CartRepo.save fails", async () => {
      const userData: User = { name: "User1" } as User;
      const createdUser: User = { ...userData, id: "1" } as User;

      (userRepo.create as jest.Mock).mockReturnValue(userData);
      (userRepo.save as jest.Mock).mockResolvedValue(createdUser);
      (cartRepo.create as jest.Mock).mockReturnValue({ user: createdUser });
      (cartRepo.save as jest.Mock).mockRejectedValue(new Error("Cart error"));

      await expect(service.CreateUser(userData)).rejects.toThrow(
        "Failed to create user: Error: Cart error",
      );
    });
  });
  describe("UpdateUser", () => {
    it("should update user successfully", async () => {
      const userId = "1";
      const existingUser = { id: userId, name: "OldName" } as User;
      const updatedData = { name: "NewName" };

      (userRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (userRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.UpdateUser(userId, updatedData);

      expect(result).toBe("ok");
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepo.update).toHaveBeenCalledWith(userId, updatedData);
    });

    it("should throw NotFoundException if user not found", async () => {
      const userId = "1";
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.UpdateUser(userId, { name: "X" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw error if update fails", async () => {
      const userId = "1";
      const existingUser = { id: userId, name: "OldName" } as User;

      (userRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (userRepo.update as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(
        service.UpdateUser(userId, { name: "FailName" }),
      ).rejects.toThrow("Failed to Update user: Error: DB error");
    });
  });
  describe("DeleteUser", () => {
    it("should throw BadRequestException if id is missing", async () => {
      await expect(service.DeleteUser("")).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if user not found", async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.DeleteUser("1")).rejects.toThrow(NotFoundException);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
        relations: ["orders", "cart", "reviews"],
      });
    });

    it("should delete user and return confirmation message", async () => {
      const mockUser = { id: "1", name: "User1" } as User;
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.DeleteUser("1");

      expect(result).toBe("the user deleted");
      expect(userRepo.remove).toHaveBeenCalledWith(mockUser);
    });
  });
  describe("FindLimitProducts", () => {
    it("should return products based on take and skip", async () => {
      const mockProducts: Product[] = [
        { id: "1", name: "Product1" } as Product,
        { id: "2", name: "Product2" } as Product,
      ];

      (productRepo.find as jest.Mock).mockResolvedValue(mockProducts);

      const result = await service.FindLimitProducts(2, 0);

      expect(result).toEqual(mockProducts);
      expect(productRepo.find).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
        relations: ["reviews"],
      });
    });

    it("should throw an error if repository.find fails", async () => {
      (productRepo.find as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(service.FindLimitProducts(2, 0)).rejects.toThrow(
        "Failed to fetch products: Error: DB error",
      );
    });
  });
  describe("FindProduct", () => {
    it("should return a product if found", async () => {
      const mockProduct: Product = { id: "1", name: "Product1" } as Product;
      (productRepo.findOne as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.FindProduct("1");

      expect(result).toEqual(mockProduct);
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
        relations: ["reviews"],
      });
    });

    it("should throw NotFoundException if product not found", async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.FindProduct("1")).rejects.toThrow(NotFoundException);
    });

    it("should rethrow HttpException if caught", async () => {
      const httpError = new NotFoundException("Some HTTP error");
      (productRepo.findOne as jest.Mock).mockRejectedValue(httpError);

      await expect(service.FindProduct("1")).rejects.toThrow(HttpException);
    });

    it("should throw InternalServerErrorException for unknown errors", async () => {
      (productRepo.findOne as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await expect(service.FindProduct("1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
  describe("CreateProduct", () => {
    it("should create and return a product successfully", async () => {
      const productData: Partial<Product> = {
        name: "Test Product",
        description: "Description",
        price: 100,
        stock: 10,
        categoryId: "cat1",
        images: ["img1"],
      };

      const createdProduct: Product = {
        id: "1",
        ...productData,
      } as Product;

      (productRepo.create as jest.Mock).mockReturnValue(productData);
      (productRepo.save as jest.Mock).mockResolvedValue(createdProduct);

      const result = await service.CreateProduct(productData);

      expect(result).toEqual(createdProduct);
      expect(productRepo.create).toHaveBeenCalledWith({
        name: "Test Product",
        description: "Description",
        more_description: undefined,
        price: 100,
        stock: 10,
        categoryId: "cat1",
        images: ["img1"],
      });
      expect(productRepo.save).toHaveBeenCalledWith(productData);
    });

    it("should throw BadRequestException if required fields are missing", async () => {
      const invalidData: Partial<Product> = { name: "Test" };

      await expect(service.CreateProduct(invalidData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw Error if ProductRepo.save fails", async () => {
      const productData: Partial<Product> = {
        name: "Test Product",
        description: "Description",
        price: 100,
        stock: 10,
      };

      (productRepo.create as jest.Mock).mockReturnValue(productData);
      (productRepo.save as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(service.CreateProduct(productData)).rejects.toThrow(
        "Failed to create product: Error: DB error",
      );
    });
  });
  describe("UpdateProduct", () => {
    it("should update a product successfully", async () => {
      const id = "1";
      const updatedProduct: Partial<Product> = { name: "Updated Product" };
      const existingProduct: Product = {
        id: "1",
        name: "Old Product",
        description: "Old",
        price: 100,
        stock: 10,
      } as Product;

      (productRepo.findOne as jest.Mock).mockResolvedValue(existingProduct);
      (productRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.UpdateProduct(id, updatedProduct);

      expect(result).toBe("Product updated successfully");
      expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(productRepo.update).toHaveBeenCalledWith(id, updatedProduct);
    });

    it("should throw BadRequestException if id is missing", async () => {
      await expect(service.UpdateProduct("", {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException if product not found", async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.UpdateProduct("1", {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw Error if update fails unexpectedly", async () => {
      const id = "1";
      const updatedProduct: Partial<Product> = { name: "Updated" };
      const existingProduct: Product = { id: "1", name: "Old" } as Product;

      (productRepo.findOne as jest.Mock).mockResolvedValue(existingProduct);
      (productRepo.update as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await expect(service.UpdateProduct(id, updatedProduct)).rejects.toThrow(
        "Failed to update product: Error: DB error",
      );
    });
  });
  describe("DeleteProduct", () => {
    it("should delete product successfully", async () => {
      const id = "1";
      const mockProduct: Product = {
        id,
        name: "Test Product",
        description: "Desc",
        price: 100,
        stock: 5,
      } as Product;

      (productRepo.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (productRepo.remove as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.DeleteProduct(id);

      expect(result).toBe("Product deleted successfully");
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ["reviews", "cartItems"],
      });
      expect(productRepo.remove).toHaveBeenCalledWith(mockProduct);
    });

    it("should throw BadRequestException if id is missing", async () => {
      await expect(service.DeleteProduct("")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException if product not found", async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.DeleteProduct("1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw Error if remove fails unexpectedly", async () => {
      const id = "1";
      const mockProduct: Product = { id, name: "Test" } as Product;

      (productRepo.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (productRepo.remove as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await expect(service.DeleteProduct(id)).rejects.toThrow(
        "Failed to delete product: Error: DB error",
      );
    });
  });
  describe("Find_Cart", () => {
    it("should return cart if found", async () => {
      const id = "1";
      const mockCart: Cart = { id } as Cart;
      (cartRepo.findOneBy as jest.Mock).mockResolvedValue(mockCart);

      const result = await service.Find_Cart(id);

      expect(result).toEqual(mockCart);
      expect(cartRepo.findOneBy).toHaveBeenCalledWith({ id });
    });

    it("should throw NotFoundException if cart not found", async () => {
      (cartRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.Find_Cart("1")).rejects.toThrow(NotFoundException);
    });
  });
  describe("Find_CartItem", () => {
    it("should return cart item if found", async () => {
      const id = "1";
      const mockCartItem: CartItem = { id } as CartItem;
      (cartItemRepo.findOneBy as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await service.Find_CartItem(id);

      expect(result).toEqual(mockCartItem);
      expect(cartItemRepo.findOneBy).toHaveBeenCalledWith({ id });
    });

    it("should throw NotFoundException if cart item not found", async () => {
      (cartItemRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.Find_CartItem("1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
