# My NestJS Backend

A modern backend application built with NestJS, Drizzle ORM, and PostgreSQL (Neon Database).

## 🚀 Tech Stack

- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework for building efficient and scalable server-side applications
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM for SQL databases
- **[Neon Database](https://neon.tech/)** - Serverless PostgreSQL
- **[dotenv](https://www.npmjs.com/package/dotenv)** - Environment variable management

## 📋 Features

- ✅ RESTful API with NestJS
- ✅ Type-safe database queries with Drizzle ORM
- ✅ PostgreSQL database hosted on Neon
- ✅ Environment configuration with dotenv
- ✅ Database schema migrations

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd my-nestjs-backend

# Install dependencies
npm install
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@your-neon-host/dbname?sslmode=require"
PORT=3000
```

## 🗄️ Database Setup

The project uses Drizzle ORM with Neon PostgreSQL database.

### Schema Migration

```bash
# Generate migration files
npm run drizzle:generate

# Push schema to database
npm run drizzle:push


```

## 🚀 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Watch mode
npm run start:dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
my-nestjs-backend/
├── drizzle/              # Database migrations
├── src/
│   ├── modules/          # Feature modules
│   ├── config/           # Configuration files
│   ├── db/         # Database schema and connection
│   └── main.ts           # Application entry point
├── .env                  # Environment variables
├── drizzle.config.ts     # Drizzle configuration
├── package.json
└── README.md
```

## 🔧 Available Scripts

```bash
npm run start          # Start the application
npm run start:dev      # Start in development mode with hot-reload
npm run start:prod     # Start in production mode
npm run build          # Build the application
npm run test           # Run tests
npm run lint           # Lint the code
```

## 📚 API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:3000/api`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is [MIT](LICENSE) licensed.

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Drizzle team for the excellent ORM
- Neon for serverless PostgreSQL hosting