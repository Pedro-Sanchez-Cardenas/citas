const nextConfig = {
  experimental: {
    turbo: {}
  },
  // Evita colisiones entre el /_next del owner y el de customer-portal.
  // Con esto, el customer-portal sirve assets bajo /customer-portal/_next/*
  assetPrefix: '/customer-portal',
};

export default nextConfig;
