import { createAdapterFactory, type CustomAdapter } from "better-auth/adapters";
import { User } from "../models/user.js";
import { Token } from "../models/token.js";
import { Account, Verification } from "../models/better-auth.js";

interface CustomAdapterConfig {
  usePlural?: boolean;
}

const getModel = (model: string): any => {
  switch (model) {
    case "user":
      return User;
    case "session":
      return Token;
    case "account":
      return Account;
    case "verification":
      return Verification;
    default:
      throw new Error(`Unknown model: ${model}`);
  }
};

const pick = (obj: any, keys: string[]): any => {
  const result: any = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
};

export const adapter = (config: CustomAdapterConfig = {}): CustomAdapter => {
  return createAdapterFactory({
    config: {
      adapterId: "sequelize",
      adapterName: "Sequelize",
      usePlural: config.usePlural ?? false,
      supportsNumericIds: false,
      supportsJSON: false,
      supportsDates: true,
      supportsBooleans: true,
    },
    adapter: () => {
      return {
        create: async ({ model, data, select }: any) => {
          const Model = getModel(model);
          
          if (model === "user") {
            const userData = {
              email: data.email,
              name: data.name || data.email?.split('@')[0] || "User",
              emailVerified: data.emailVerified || false,
              image: data.image || null,
              password: "managed-by-better-auth",
            };
            const result = await Model.create(userData);
            return select ? pick(result.toJSON(), select) : result.toJSON();
          }
          
          if (model === "session") {
            const sessionData = {
              userId: data.userId,
              token: data.token,
              expiresAt: data.expiresAt,
              deviceName: "Browser",
              devicePrint: "generated",
              lastUsed: new Date(),
            };
            const result = await Model.create(sessionData);
            return select ? pick(result.toJSON(), select) : result.toJSON();
          }
          
          const result = await Model.create(data);
          return select ? pick(result.toJSON(), select) : result.toJSON();
        },
        update: async ({ model, where, update }: any) => {
          const Model = getModel(model);
          
          if (model === "session" && update.expiresAt) {
            update.lastUsed = new Date();
          }
          
          const [count, updated] = await Model.update(update, { where, returning: true });
          if (count === 0) return null;
          return updated[0].toJSON();
        },
        updateMany: async ({ model, where, update }: any) => {
          const Model = getModel(model);
          const [count] = await Model.update(update, { where });
          return count;
        },
        delete: async ({ model, where }: any) => {
          const Model = getModel(model);
          await Model.destroy({ where });
        },
        deleteMany: async ({ model, where }: any) => {
          const Model = getModel(model);
          return Model.destroy({ where });
        },
        findOne: async ({ model, where, select }: any) => {
          const Model = getModel(model);
          const result = await Model.findOne({ where });
          if (!result) return null;
          return select ? pick(result.toJSON(), select) : result.toJSON();
        },
        findMany: async ({ model, where, limit, offset, select }: any) => {
          const Model = getModel(model);
          const results = await Model.findAll({ where, limit, offset });
          return results.map((r: any) => select ? pick(r.toJSON(), select) : r.toJSON());
        },
        count: async ({ model, where }: any) => {
          const Model = getModel(model);
          return Model.count({ where });
        },
      };
    },
  }) as unknown as CustomAdapter;
};

export type Adapter = typeof adapter;