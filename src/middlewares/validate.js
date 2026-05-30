// src/middlewares/validate.js
import ApiError from "../utils/ApiError.js";

const validate = (schema) => {
  
  return (req, res, next) => {
   
    
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/"/g, ""),
      }));

      throw new ApiError(400, "Dados inválidos", errors);
    }

    next();
  };
};

export default validate;
