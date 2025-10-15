import { response } from "express";

type SuccessResponse = {
  status: number;
  message: string;
  data: unknown;
};

export const successResponse = ({ status, message, data }: SuccessResponse) => {
  response.status(status).json({
    status,
    message,
    data,
  });
};

export const errorResponse = ({
  status,
  message,
}: {
  status: number;
  message: string;
}) => {
  response.status(status).json({
    status,
    message,
    data: null,
  });
};
