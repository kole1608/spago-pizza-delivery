# 🍕 Spago Pizza Delivery PWA

Modern pizza delivery application built with Next.js 14, featuring real-time order tracking, kitchen management, and driver dispatch system.

## 🚀 Features

### Customer Features
- 🛒 Online ordering with customization
- 📱 PWA support (installable app)
- 🔄 Real-time order tracking
- 👤 Customer account management
- 💳 Multiple payment methods
- 📍 Address management

### Kitchen Management
- 👨‍🍳 Real-time order queue
- ⏱️ Preparation timers
- 🏪 Kitchen station management
- 📊 Order analytics
- 🔔 Sound notifications

### Driver Interface
- 🚗 Mobile-optimized delivery interface
- 📍 GPS tracking and navigation
- 📞 Customer communication
- ✅ Delivery confirmation
- 📱 PWA offline support

### Admin Dashboard
- 📊 Comprehensive analytics
- 👥 User management
- 📋 Order management
- 🏪 Store settings
- 📈 Performance metrics

### Call Center
- 📞 Professional call center interface
- 👤 Customer lookup
- 🍕 Quick order entry
- 📋 Order management
- ⏱️ Call tracking

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** PostgreSQL/SQLite with Prisma ORM
- **Authentication:** NextAuth.js
- **State Management:** Zustand
- **API:** tRPC (type-safe)
- **PWA:** next-pwa ready
- **Real-time:** WebSocket ready

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/kole1608/spago-pizza-delivery.git
cd spago-pizza-delivery
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="file:./dev.db"
```

5. Set up the database:
```bash
npm run db:push
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

## 🎯 Demo Accounts

### Administrator
- **Email:** admin@spago.com
- **Password:** password123
- **Access:** Full admin dashboard, analytics, user management

### Kitchen Staff
- **Email:** kitchen@spago.com
- **Password:** password123
- **Access:** Kitchen dashboard, order management, preparation tracking

### Delivery Driver
- **Email:** driver@spago.com
- **Password:** password123
- **Access:** Driver mobile interface, delivery tracking, GPS navigation

## 🏗️ Project Structure

```
spago-pizza/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── auth/           # Authentication pages
│   │   ├── call-center/    # Call center interface
│   │   ├── driver/         # Driver mobile interface
│   │   ├── kitchen/        # Kitchen management
│   │   └── api/            # API routes
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── analytics/     # Analytics components
│   │   ├── call-center/   # Call center specific
│   │   ├── kitchen/       # Kitchen specific
│   │   └── layout/        # Layout components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── stores/            # State management
│   ├── types/             # TypeScript type definitions
│   └── server/            # Server-side logic
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── package.json           # Project dependencies
```

## 🌐 Available Routes

### Public Routes
- `/` - Homepage
- `/menu` - Pizza menu and ordering
- `/auth/signin` - User authentication

### Protected Routes
- `/admin/dashboard` - Admin panel
- `/kitchen` - Kitchen management interface
- `/driver` - Driver mobile interface
- `/call-center` - Call center system
- `/orders` - Order tracking
- `/dashboard` - Customer dashboard

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data

### Testing Different Interfaces

1. **Customer Interface:**
   - Visit: `http://localhost:3000`
   - Browse menu, add items to cart, place orders

2. **Kitchen Dashboard:**
   - Login with kitchen@spago.com
   - Visit: `http://localhost:3000/kitchen`
   - Manage incoming orders, track preparation

3. **Driver Interface:**
   - Login with driver@spago.com
   - Visit: `http://localhost:3000/driver`
   - Mobile-optimized delivery tracking

4. **Call Center:**
   - Login with any account
   - Visit: `http://localhost:3000/call-center`
   - Professional order entry system

5. **Admin Dashboard:**
   - Login with admin@spago.com
   - Visit: `http://localhost:3000/admin/dashboard`
   - Analytics, user management, settings

## 🎨 UI/UX Features

- **Responsive Design:** Works on all device sizes
- **Dark/Light Mode:** Theme switching support
- **PWA Ready:** Installable as native app
- **Real-time Updates:** Live order status updates
- **Keyboard Shortcuts:** Efficiency for power users
- **Sound Notifications:** Audio alerts for kitchen staff
- **Offline Support:** Basic functionality without internet

## 🔐 Authentication & Security

- **NextAuth.js:** Secure authentication system
- **Role-based Access:** Different permissions for each user type
- **JWT Sessions:** Stateless session management
- **Protected Routes:** Middleware-based route protection
- **CSRF Protection:** Built-in security measures

## 📱 PWA Features

- **Installable:** Add to home screen
- **Offline Capable:** Basic functionality without internet
- **Push Notifications:** Order updates and alerts
- **Background Sync:** Queue actions when offline
- **App-like Experience:** Native app feel

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kole1608**
- GitHub: [@kole1608](https://github.com/kole1608)
- Email: slobodan90kostic@gmail.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- Vercel for hosting and deployment platform
- All contributors who helped build this project

---

Made with ❤️ and lots of 🍕
