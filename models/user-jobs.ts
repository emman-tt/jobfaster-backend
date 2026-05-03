import { sequelize } from "../database/pool";
import {
  DataTypes,
  InferAttributes,
  Model,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

interface JobModel extends Model<
  InferAttributes<JobModel>,
  InferCreationAttributes<JobModel>
> {
  id: CreationOptional<string>;
  userId: string;
  jobId: string;
  status: "applied" | "saved" | "rejected" | "offered" | 'ongoing';
  jobTitle: string | null;
  employerName: string;
  employerLogo: string;
  employerWebsite: string;
  jobPublisher: string;
  jobApplyLink: string;
  jobLocation: string;
  jobCity: string;
  jobState: string;
  jobCountry: string;
  jobEmploymentType: string;
  jobPostedHumanReadable: string | null;
  jobDescription: string;
  jobIsRemote: boolean;
  jobSalary: string | null;
  jobSalaryString: string | null;
  jobMinSalary: number | null;
  jobMaxSalary: number | null;
  jobSalaryPeriod: string | null;
  jobHighlights: Record<string, string[]>;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export const UserJob = sequelize.define<JobModel>("user_job", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    references: {
      model: "user",
      key: "id",
    },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jobId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  employerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  employerWebsite: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  employerLogo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobPublisher: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobApplyLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobLocation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobCity: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobState: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobCountry: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobEmploymentType: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  jobPostedHumanReadable: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  jobIsRemote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  jobSalary: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobSalaryString: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobMinSalary: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  jobMaxSalary: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  jobSalaryPeriod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobHighlights: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
