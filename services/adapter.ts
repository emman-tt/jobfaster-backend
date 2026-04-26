import { createAdapterFactory, type CustomAdapter } from "better-auth/adapters";
import { User } from "../models/user.js";
import { Token } from "../models/token.js";
import { Account, Verification } from "../models/better-auth.js";
import { sequelize } from "../database/pool.js";
import { Op } from "sequelize";

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
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
    },
    adapter: () => {
      return {
        create: async ({ model, data, select }: any) => {
          const Model = getModel(model);
          
          if (model === "user") {
            const existingUser = await Model.findOne({ 
              where: { 
                email: {
                  [Op.iLike]: data.email
                }
              }
            });
            
            if (existingUser) {
              return select ? pick(existingUser.toJSON(), select) : existingUser.toJSON();
            }
            
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
              expiresAt: new Date(data.expiresAt),
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
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          const [count, updated] = await Model.update(update, { where: sequelizeWhere, returning: true });
          if (count === 0) return null;
          return updated[0].toJSON();
        },
        updateMany: async ({ model, where, update }: any) => {
          const Model = getModel(model);
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          const [count] = await Model.update(update, { where: sequelizeWhere });
          return count;
        },
        delete: async ({ model, where }: any) => {
          const Model = getModel(model);
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          await Model.destroy({ where: sequelizeWhere });
        },
        deleteMany: async ({ model, where }: any) => {
          const Model = getModel(model);
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          return Model.destroy({ where: sequelizeWhere });
        },
        findOne: async ({ model, where, select }: any) => {
          const Model = getModel(model);
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          const result = await Model.findOne({ where: sequelizeWhere });
          if (!result) return null;
          return select ? pick(result.toJSON(), select) : result.toJSON();
        },
        findMany: async ({ model, where, limit, offset, select }: any) => {
          const Model = getModel(model);
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          const results = await Model.findAll({ where: sequelizeWhere, limit, offset });
          return results.map((r: any) => select ? pick(r.toJSON(), select) : r.toJSON());
        },
        count: async ({ model, where }: any) => {
          const Model = getModel(model);
          
          let sequelizeWhere: any = where;
          
          if (Array.isArray(where) && where.length > 0 && 'field' in where[0]) {
            sequelizeWhere = { [where[0].field]: where[0].value };
          } else if (where && typeof where === 'object' && 'field' in where) {
            sequelizeWhere = { [where.field]: where.value };
          }
          
          return Model.count({ where: sequelizeWhere });
        },
      };
    },
  }) as unknown as CustomAdapter;
};

export type Adapter = typeof adapter;