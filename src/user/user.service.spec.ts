import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("UserService", () => {
  let service: UserService;
  let userRepo: Record<string, jest.Mock>;
  let productRepo: Record<string, jest.Mock>;
  let reviewRepo: Record<string, jest.Mock>;
  let cartRepo: Record<string, jest.Mock>;
  let cartItemRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: {} },
        {
          provide: "UserRepository",
          useValue: { findOne: jest.fn() },
        },
        {
          provide: "ProductRepository",
          useValue: { findOne: jest.fn(), findOneBy: jest.fn() },
        },
        {
          provide: "ReviewRepository",
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: "CartRepository",
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: "CartItemRepository",
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get("UserRepository");
    productRepo = module.get("ProductRepository");
    reviewRepo = module.get("ReviewRepository");
    cartRepo = module.get("CartRepository");
    cartItemRepo = module.get("CartItemRepository");
  });

  describe("Check if service defined", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });

  describe("Add_Review", () => {
    it("should throw if user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.Add_Review("x@test.com", "good", "1", 5),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw if product not found", async () => {
      userRepo.findOne.mockResolvedValue({ isVerified: true });
      productRepo.findOne.mockResolvedValue(null);
      await expect(
        service.Add_Review("x@test.com", "good", "1", 5),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return ok if review saved successfully", async () => {
      const mockUser = { email: "x@test.com", isVerified: true };
      const mockProduct = { id: "1" };
      userRepo.findOne.mockResolvedValue(mockUser);
      productRepo.findOne.mockResolvedValue(mockProduct);
      reviewRepo.create.mockReturnValue({});
      reviewRepo.save.mockResolvedValue({});

      const result = await service.Add_Review("x@test.com", "good", "1", 5);
      expect(result).toBe("ok");
    });
  });
  describe("Edit_Review", () => {
    it("should throw notfoundexception", async () => {
      reviewRepo.findOne.mockResolvedValue(null);
      await expect(
        service.Edit_Review("x@test.com", "343", "good", 5),
      ).rejects.toThrow(NotFoundException);
    });
    it("should throw NotFoundException if user not authorized", async () => {
      const mockReview = { user: { email: "other@test.com" } }; // مستخدم مختلف
      reviewRepo.findOne.mockResolvedValue(mockReview);

      await expect(
        service.Edit_Review("x@test.com", "343", "good", 5),
      ).rejects.toThrow(NotFoundException);
    });

    it("should pass if user owns review", async () => {
      const mockReview = { user: { email: "x@test.com" } };
      reviewRepo.findOne.mockResolvedValue(mockReview);
      reviewRepo.update.mockResolvedValue({});

      const result = await service.Edit_Review("x@test.com", "343", "good", 5);
      expect(result).toBeDefined();
    });
  });
  describe("Remove_Review", () => {
    it("must retutn NotFoundException", async () => {
      reviewRepo.findOne.mockResolvedValue(null);
      await expect(service.Remove_Review("x@test.com", "343")).rejects.toThrow(
        NotFoundException,
      );
    });
    it("should throw NotFoundException when user email does not match", async () => {
      reviewRepo.findOne.mockResolvedValue({
        id: "343",
        user: { email: "other@test.com" },
      });
      await expect(service.Remove_Review("x@test.com", "343")).rejects.toThrow(
        NotFoundException,
      );
    });
    it("should delete review and return ok when authorized", async () => {
      reviewRepo.findOne.mockResolvedValue({
        id: "343",
        user: { email: "x@test.com" },
      });
      reviewRepo.delete.mockResolvedValue({});
      const result = await service.Remove_Review("x@test.com", "343");

      expect(reviewRepo.delete).toHaveBeenCalledWith({ id: "343" });
      expect(result).toBe("ok");
    });
  });
  describe("Add_Cart_Item", () => {
    it("should throw NotFoundException if cart not found", async () => {
      cartRepo.findOneBy.mockResolvedValue(null);

      await expect(service.Add_Cart_Item("343", "444")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if product not found", async () => {
      // mock cart exists
      cartRepo.findOneBy.mockResolvedValue({ id: "343" });
      // mock product missing
      productRepo.findOneBy.mockResolvedValue(null);

      await expect(service.Add_Cart_Item("343", "444")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if item already in cart", async () => {
      cartRepo.findOneBy.mockResolvedValue({ id: "343" });
      productRepo.findOneBy.mockResolvedValue({ id: "444" });
      cartItemRepo.findOne.mockResolvedValue({ id: "1" }); // item already exists

      await expect(service.Add_Cart_Item("343", "444")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should create and save new cart item when all valid", async () => {
      const mockCart = { id: "343" };
      const mockProduct = { id: "444" };
      const mockCartItem = { id: "999" };

      cartRepo.findOneBy.mockResolvedValue(mockCart);
      productRepo.findOneBy.mockResolvedValue(mockProduct);
      cartItemRepo.findOne.mockResolvedValue(null);
      cartItemRepo.create.mockReturnValue(mockCartItem);
      cartItemRepo.save.mockResolvedValue(mockCartItem);

      const result = await service.Add_Cart_Item("343", "444");

      expect(cartItemRepo.create).toHaveBeenCalledWith({
        quantity: 1,
        cart: mockCart,
        product: mockProduct,
      });
      expect(cartItemRepo.save).toHaveBeenCalledWith(mockCartItem);
      expect(result).toBe("ok");
    });
  });
  describe("Remove_Cart_Item", () => {
    it("should throw NotFoundException if cart not found", async () => {
      cartRepo.findOneBy.mockResolvedValue(null);
      await expect(service.Remove_Cart_Item("1", "2")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if product not found", async () => {
      cartRepo.findOneBy.mockResolvedValue({ id: "1" });
      productRepo.findOneBy.mockResolvedValue(null);
      await expect(service.Remove_Cart_Item("1", "2")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if cart item not found", async () => {
      cartRepo.findOneBy.mockResolvedValue({ id: "1" });
      productRepo.findOneBy.mockResolvedValue({ id: "2" });
      cartItemRepo.findOne.mockResolvedValue(null);
      await expect(service.Remove_Cart_Item("1", "2")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should remove cart item and return ok", async () => {
      const mockItem = { id: "3" };
      cartRepo.findOneBy.mockResolvedValue({ id: "1" });
      productRepo.findOneBy.mockResolvedValue({ id: "2" });
      cartItemRepo.findOne.mockResolvedValue(mockItem);
      cartItemRepo.remove.mockResolvedValue({});

      const result = await service.Remove_Cart_Item("1", "2");

      expect(cartItemRepo.remove).toHaveBeenCalledWith(mockItem);
      expect(result).toBe("ok");
    });
  });

  describe("increase_Quantity", () => {
    it("should throw NotFoundException if cart item not found", async () => {
      cartItemRepo.findOneBy.mockResolvedValue(null);
      await expect(service.increase_Quantity("1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return 'no' if quantity >= 999", async () => {
      cartItemRepo.findOneBy.mockResolvedValue({ id: "1", quantity: 999 });
      const result = await service.increase_Quantity("1");
      expect(result).toBe("no");
    });

    it("should increment quantity and save if valid", async () => {
      const mockItem = { id: "1", quantity: 5 };
      cartItemRepo.findOneBy.mockResolvedValue(mockItem);
      cartItemRepo.save.mockResolvedValue({});

      const result = await service.increase_Quantity("1");

      expect(mockItem.quantity).toBe(6);
      expect(cartItemRepo.save).toHaveBeenCalledWith(mockItem);
      expect(result).toBe("ok");
    });
  });

  describe("decrease_Quantity", () => {
    it("should throw NotFoundException if cart item not found", async () => {
      cartItemRepo.findOneBy.mockResolvedValue(null);
      await expect(service.decrease_Quantity("1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return 'no' if quantity <= 1", async () => {
      cartItemRepo.findOneBy.mockResolvedValue({ id: "1", quantity: 1 });
      const result = await service.decrease_Quantity("1");
      expect(result).toBe("no");
    });

    it("should decrement quantity and save if valid", async () => {
      const mockItem = { id: "1", quantity: 5 };
      cartItemRepo.findOneBy.mockResolvedValue(mockItem);
      cartItemRepo.save.mockResolvedValue({});

      const result = await service.decrease_Quantity("1");

      expect(mockItem.quantity).toBe(4);
      expect(cartItemRepo.save).toHaveBeenCalledWith(mockItem);
      expect(result).toBe("ok");
    });
  });

  describe("SearchProducts", () => {
    it("should return paginated products", async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: "p1" }], 1]),
      };
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQB);

      const result = await service.SearchProducts("test", 1);
      expect(result).toEqual({
        products: [{ id: "p1" }],
        currentPage: 1,
        totalPages: 1,
      });
    });

    it("should throw error if query builder fails", async () => {
      productRepo.createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error("fail");
      });
      await expect(service.SearchProducts("x", 1)).rejects.toThrow(
        /Failed to search products/,
      );
    });
  });

  describe("FindProductsByCategory", () => {
    it("should return paginated products by category", async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: "p2" }], 1]),
      };
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQB);

      const result = await service.FindProductsByCategory("cat1", 1);
      expect(result).toEqual({
        products: [{ id: "p2" }],
        currentPage: 1,
        totalPages: 1,
      });
    });

    it("should throw error if query builder fails", async () => {
      productRepo.createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error("fail");
      });
      await expect(service.FindProductsByCategory("cat1", 1)).rejects.toThrow(
        /Failed to fetch products by category/,
      );
    });
  });
});
