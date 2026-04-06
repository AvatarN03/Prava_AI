/** @type {import('next').NextConfig} */
const nextConfig = {
    api: {
    bodyParser: {
      sizeLimit: '10mb', // increase limit here
    },
  },
};

export default nextConfig;
