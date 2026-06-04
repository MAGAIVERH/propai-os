import fp from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

/** Registers Zod validator/serializer compilers for schema-driven routes. */
export const zodValidatorPlugin = fp(async (app) => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
});
