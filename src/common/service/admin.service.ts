/** biome-ignore-all lint/complexity/noStaticOnlyClass: <> */
/** biome-ignore-all lint/complexity/noThisInStatic: <> */
import { db } from "@/db";
import type { WalletDocument } from "@/db/models/wallet.model";

/**
 * Admin Service
 * Centralized service for managing admin user and wallet
 */
export class AdminService {
  private static adminUserId: string | null = null;
  private static adminWallet: WalletDocument | null = null;

  /**
   * Get or create admin user ID
   * @returns Admin user ID
   */
  static async getAdminUserId(): Promise<string> {
    if (this.adminUserId) {
      return this.adminUserId;
    }

    // Try to get from environment variable first
    const envAdminId = process.env.ADMIN_USER_ID;
    if (envAdminId) {
      // Verify admin user exists
      const admin = await db.user.findById(envAdminId);
      if (admin && admin.role === "admin") {
        this.adminUserId = envAdminId;
        return this.adminUserId;
      }
    }

    // Find existing admin user
    let admin = await db.user.findOne({ role: "admin" });

    if (!admin) {
      // Create default admin user
      admin = await db.user.create({
        role: "admin",
        full_name: "System Admin",
        email: "admin@jobsphere.com",
        password: "$2a$10$defaultHashedPassword", // Should be changed on first login
        phone: "0000000000",
        address: "System",
        bio: "System Administrator",
        description: "System Administrator Account",
        is_verified: true,
        isSuspend: false,
        profile_img: "",
        cover_img: "",
        category: [],
        review: [],
        skills: [],
        experience: [],
        work_samples: [],
        certifications: [],
        job: [],
        starting_budget: 0,
        hourly_charge: 0,
      });

      console.log("✅ Admin user created:", admin._id);
    }

    this.adminUserId = (admin._id as any).toString();
    return this.adminUserId as string;
  }

  /**
   * Get or create admin wallet
   * @returns Admin wallet document
   */
  static async getAdminWallet(): Promise<WalletDocument> {
    // Return cached wallet if available
    if (this.adminWallet) {
      // Refresh wallet data
      const refreshed = await db.wallet.findById(this.adminWallet._id);
      if (refreshed) {
        this.adminWallet = refreshed;
        return this.adminWallet;
      }
    }

    const adminId = await this.getAdminUserId();

    let wallet = await db.wallet.findOne({ user: adminId });

    if (!wallet) {
      wallet = await db.wallet.create({
        user: adminId,
        balance: 0,
        currency: "USD",
        isActive: true,
        isFrozen: false,
        totalEarnings: 0,
        totalSpent: 0,
        totalWithdrawals: 0,
        stripeCustomerId: null,
        stripeConnectAccountId: null,
      });

      console.log("✅ Admin wallet created:", wallet._id);
    }

    this.adminWallet = wallet;
    return wallet;
  }

  /**
   * Clear cached admin data (useful for testing)
   */
  static clearCache(): void {
    this.adminUserId = null;
    this.adminWallet = null;
  }
}
