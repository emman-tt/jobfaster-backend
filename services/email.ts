import express, { Request, Response } from "express";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();
export const resend = new Resend(process.env.EMAIL_SERVICE);
