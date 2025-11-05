/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { LogService } from "../log/log.service";
import { ThrottlerGuard } from "@nestjs/throttler";
import { User } from "../entities/User.entity";
import { Product } from "../entities/Product.entity";
import { Cart } from "../entities/Cart.entity";
import { CartItem } from "../entities/Cart_Item.entity";
import { Log } from "../entities/Log.entity";

describe("AdminController", () => {
  let controller: AdminController;
  let adminService: AdminService;
  let logService: LogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            FindLimitUser: jest.fn(),
            FindUser: jest.fn(),
            CreateUser: jest.fn(),
            UpdateUser: jest.fn(),
            DeleteUser: jest.fn(),
            FindLimitProducts: jest.fn(),
            FindProduct: jest.fn(),
            CreateProduct: jest.fn(),
            UpdateProduct: jest.fn(),
            DeleteProduct: jest.fn(),
            Find_Cart: jest.fn(),
            Find_CartItem: jest.fn(),
          },
        },
        {
          provide: LogService,
          useValue: {
            getlog: jest.fn(),
          },
        },
        {
          provide: "THROTTLER:MODULE_OPTIONS",
          useValue: {},
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminController);
    adminService = module.get(AdminService);
    logService = module.get(LogService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("FindLimitUser", () => {
    it("should return users", async () => {
      const mockUsers = [{ id: "1", name: "User1" }] as unknown as User[];
      jest.spyOn(adminService, "FindLimitUser").mockResolvedValue(mockUsers);

      const result = await controller.FindLimitUser({ take: 1, skip: 0 });
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Users retrieved successfully",
          data: mockUsers,
        }),
      );
      expect(adminService.FindLimitUser).toHaveBeenCalledWith(1, 0);
    });
  });

  describe("FindUser", () => {
    it("should return one user", async () => {
      const mockUser = { id: "1", name: "User1" } as unknown as User;
      jest.spyOn(adminService, "FindUser").mockResolvedValue(mockUser);

      const result = await controller.FindUser("1");
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "User retrieved successfully",
          data: mockUser,
        }),
      );
    });
  });

  describe("CreateUser", () => {
    it("should create user and return response", async () => {
      const mockUser = { id: "1", name: "User1" } as unknown as User;
      jest.spyOn(adminService, "CreateUser").mockResolvedValue(mockUser);

      const result = await controller.CreateUser(mockUser);
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "User created successfully",
          data: mockUser,
        }),
      );
      expect(adminService.CreateUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("UpdateUser", () => {
    it("should update user", async () => {
      jest.spyOn(adminService, "UpdateUser").mockResolvedValue("ok");

      const result = await controller.UpdateUser({
        id: "1",
        updated_User: {
          name: "New",
          id: "",
          Photo: "",
          email: "",
          provider: "local",
          role: "user",
          isVerified: false,
          refresh_Token: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          orders: [],
          cart: new Cart(),
          reviews: [],
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "User updated successfully",
        }),
      );
      expect(adminService.UpdateUser).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({ name: "New" }),
      );
    });
  });

  describe("DeleteUser", () => {
    it("should delete user", async () => {
      jest.spyOn(adminService, "DeleteUser").mockResolvedValue("ok");

      const result = await controller.DeleteUser("1");
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "User deleted successfully",
        }),
      );
    });
  });

  describe("FindLimitProducts", () => {
    it("should return limited products", async () => {
      const mockProducts = [{ id: "1", name: "Prod" }] as unknown as Product[];
      jest
        .spyOn(adminService, "FindLimitProducts")
        .mockResolvedValue(mockProducts);

      const result = await controller.FindLimitProducts({ take: 2, skip: 0 });
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Products retrieved successfully",
          data: mockProducts,
        }),
      );
    });
  });

  describe("FindProduct", () => {
    it("should return product by id", async () => {
      const mockProduct = { id: "1", name: "Prod" } as unknown as Product;
      jest.spyOn(adminService, "FindProduct").mockResolvedValue(mockProduct);

      const result = await controller.FindProduct("1");
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Product retrieved successfully",
          data: mockProduct,
        }),
      );
    });
  });

  describe("CreateProduct", () => {
    it("should create product", async () => {
      const mockProduct = { id: "1", name: "Prod" } as unknown as Product;
      jest.spyOn(adminService, "CreateProduct").mockResolvedValue(mockProduct);

      const result = await controller.CreateProduct(mockProduct);
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Product created successfully",
          data: mockProduct,
        }),
      );
    });
  });

  describe("UpdateProduct", () => {
    it("should update product", async () => {
      jest
        .spyOn(adminService, "UpdateProduct")
        .mockResolvedValue("Product updated successfully");

      const result = await controller.UpdateProduct({
        id: "1",
        updatedProduct: {
          name: "new",
          id: "",
          description: "",
          price: 0,
          stock: 0,
          images: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [],
          cartItems: [],
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Product updated successfully",
        }),
      );
    });
  });

  describe("DeleteProduct", () => {
    it("should delete product", async () => {
      jest
        .spyOn(adminService, "DeleteProduct")
        .mockResolvedValue("Product deleted successfully");

      const result = await controller.DeleteProduct("1");
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Product deleted successfully",
        }),
      );
    });
  });

  describe("Find_Cart", () => {
    it("should return cart by id", async () => {
      const mockCart = { id: "1" } as unknown as Cart;
      jest.spyOn(adminService, "Find_Cart").mockResolvedValue(mockCart);

      const result = await controller.Find_Cart({ id: "1" });
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Cart retrieved successfully",
          data: mockCart,
        }),
      );
    });
  });

  describe("Find_CartItem", () => {
    it("should return cart item by id", async () => {
      const mockCartItem = { id: "1" } as unknown as CartItem;
      jest.spyOn(adminService, "Find_CartItem").mockResolvedValue(mockCartItem);

      const result = await controller.Find_CartItem({ id: "1" });
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Cart item retrieved successfully",
          data: mockCartItem,
        }),
      );
    });
  });

  describe("getlog", () => {
    it("should return logs", async () => {
      const mockLogs = [
        { id: "1", message: "log", level: "info", timestamp: new Date() },
      ] as unknown as Log[];
      jest.spyOn(logService, "getlog").mockResolvedValue(mockLogs);

      const result = await controller.getlog({ take: 2, skip: 0 });
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Logs retrieved successfully",
          data: mockLogs,
        }),
      );
      expect(logService.getlog).toHaveBeenCalledWith(2, 0);
    });
  });
});
