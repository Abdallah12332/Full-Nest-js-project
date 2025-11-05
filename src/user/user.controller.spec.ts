/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { ThrottlerGuard } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards/auth.guard";

describe("UserController", () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            Add_Review: jest.fn(),
            Edit_Review: jest.fn(),
            Remove_Review: jest.fn(),
            Add_Cart_Item: jest.fn(),
            Remove_Cart_Item: jest.fn(),
            increase_Quantity: jest.fn(),
            decrease_Quantity: jest.fn(),
            SearchProducts: jest.fn(),
            FindProductsByCategory: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call Add_Review", async () => {
    jest.spyOn(service, "Add_Review").mockResolvedValue("ok");
    const result = await controller.Add_Review({
      email: "a@b.com",
      comment: "good",
      productId: "1",
      rating: 5,
    });
    expect(service.Add_Review).toHaveBeenCalledWith("a@b.com", "good", "1", 5);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Review added successfully",
      }),
    );
  });

  it("should call Edit_Review", async () => {
    jest.spyOn(service, "Edit_Review").mockResolvedValue("ok");
    const result = await controller.Edit_Review({
      email: "a@b.com",
      reviewId: "123",
      comment: "updated",
      rating: 4,
    });
    expect(service.Edit_Review).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Review updated successfully",
      }),
    );
  });

  it("should call Remove_Review", async () => {
    jest.spyOn(service, "Remove_Review").mockResolvedValue("ok");
    const result = await controller.Remove_Review({
      email: "a@b.com",
      reviewId: "123",
    });
    expect(service.Remove_Review).toHaveBeenCalledWith("a@b.com", "123");
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Review removed successfully",
      }),
    );
  });

  it("should call Add_Cart_Item", async () => {
    jest.spyOn(service, "Add_Cart_Item").mockResolvedValue("ok");
    const result = await controller.Add_Cart_Item({
      cartId: "c1",
      productId: "p1",
    });
    expect(service.Add_Cart_Item).toHaveBeenCalledWith("c1", "p1");
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Item added to cart successfully",
      }),
    );
  });

  it("should call Remove_Cart_Item", async () => {
    jest.spyOn(service, "Remove_Cart_Item").mockResolvedValue("ok");
    const result = await controller.Remove_Cart_Item({
      cartId: "c1",
      productId: "p1",
    });
    expect(service.Remove_Cart_Item).toHaveBeenCalledWith("c1", "p1");
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Item removed from cart successfully",
      }),
    );
  });

  it("should call increase_Quantity", async () => {
    jest.spyOn(service, "increase_Quantity").mockResolvedValue("ok");
    const result = await controller.increase_Quantity({ cartItemId: "ci1" });
    expect(service.increase_Quantity).toHaveBeenCalledWith("ci1");
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Quantity increased successfully",
      }),
    );
  });

  it("should call decrease_Quantity", async () => {
    jest.spyOn(service, "decrease_Quantity").mockResolvedValue("ok");
    const result = await controller.decrease_Quantity({ cartItemId: "ci1" });
    expect(service.decrease_Quantity).toHaveBeenCalledWith("ci1");
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Quantity decreased successfully",
      }),
    );
  });

  it("should call SearchProducts", async () => {
    const mockResult = {
      products: [],
      currentPage: 1,
      totalPages: 1,
    };
    jest.spyOn(service, "SearchProducts").mockResolvedValue(mockResult);
    const result = await controller.SearchProducts({
      searchTerm: "test",
      page: 1,
    });
    expect(service.SearchProducts).toHaveBeenCalledWith("test", 1);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Products retrieved successfully",
        data: mockResult.products,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        pagination: expect.objectContaining({
          currentPage: mockResult.currentPage,
          totalPages: mockResult.totalPages,
        }),
      }),
    );
  });

  it("should call FindProductsByCategory", async () => {
    const mockResult = {
      products: [],
      currentPage: 1,
      totalPages: 1,
    };
    jest.spyOn(service, "FindProductsByCategory").mockResolvedValue(mockResult);
    const result = await controller.FindProductsByCategory({
      categoryId: "cat1",
      page: 2,
    });
    expect(service.FindProductsByCategory).toHaveBeenCalledWith("cat1", 2);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: "Products retrieved successfully",
        data: mockResult.products,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        pagination: expect.objectContaining({
          currentPage: mockResult.currentPage,
          totalPages: mockResult.totalPages,
        }),
      }),
    );
  });
});
