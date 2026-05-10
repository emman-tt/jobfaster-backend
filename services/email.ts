import express, { Request, Response } from "express";
import { Resend } from "resend";
export const resend = new Resend(process.env.EMAIL_SERVICE);
