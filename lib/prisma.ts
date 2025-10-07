
type PrismaClientLike = {
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<{
      id: string;
      email: string;
      name: string | null;
      password: string | null;
    } | null>;
  };
  visit: {
    create: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  lodgeWorking: {
    create: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  $disconnect?: () => Promise<void>;
};

function createStub(): PrismaClientLike {
  const missingClientError = new Error(
    "Prisma Client has not been generated. Run `pnpm exec prisma generate` to enable database access."
  );

  const reject = async () => {
    throw missingClientError;
  };

  return {
    user: {
      findUnique: async () => null,
    },
    visit: {
      create: reject,
      delete: reject,
    },
    lodgeWorking: {
      create: reject,
      delete: reject,
    },
  } satisfies PrismaClientLike;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientLike | undefined;
}

const prismaClient = (() => {
  if (global.prisma) return global.prisma;

  try {
    const { PrismaClient } = require("@prisma/client");
    const instance: PrismaClientLike = new PrismaClient({
      log: ["error", "warn"],
    });
    if (process.env.NODE_ENV !== "production") {
      global.prisma = instance;
    }
    return instance;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Falling back to a stub Prisma client because the generated client could not be loaded:",
        error
      );
    }
    const stub = createStub();
    global.prisma = stub;
    return stub;
  }
})();

export const prisma = prismaClient;
