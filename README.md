# KampusAbla (CampusSister) 👩‍🎓

> **Verified Student Marketplace for After-School Pickup + Edu-Sitting Services**

A trusted platform connecting verified university students with parents who need safe, reliable after-school care and educational support for their children in Istanbul.

---

## 🎯 Overview

**KampusAbla** solves a critical need for working parents: finding trustworthy, vetted university students to pick up children from school and provide 2-3 hours of language practice (Turkish/English) and homework support until parents arrive home.

### Key Features

✅ **Verified Students** - University email, ID verification, background checks  
✅ **Live GPS Tracking** - Real-time location sharing during sessions  
✅ **In-App Chat** - Secure messaging without phone number sharing  
✅ **Safe Payments** - Platform-managed payments with 10% service fee  
✅ **Two-Way Reviews** - Build trust through verified reviews  
✅ **Flexible Booking** - Browse sitters or post your needs  

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/verified-campus-buddy.git
cd verified-campus-buddy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev
npx prisma generate

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 📁 Project Structure

```
verified-campus-buddy/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable components
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript types
├── prisma/              # Database schema
├── public/              # Static assets
├── tests/               # Test files
├── PRD.md              # Product Requirements
├── implementation_plan.md  # Development roadmap
└── agent.md            # Developer context
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **Node.js** - Runtime
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **NextAuth.js** - Authentication

### Services
- **iyzico/Papara** - Payment processing
- **Google Maps API** - Location services
- **Firebase Cloud Messaging** - Push notifications
- **Socket.io** - Real-time features

---

## 👥 User Roles

### Parents
- Create and manage child profiles
- Search verified sitters by location, language, and availability
- Book sessions and track live location
- Rate and review sitters

### Sitters (University Students)
- Complete verification process
- Set availability and hourly rates
- Accept booking requests
- Earn flexible income

### Admin
- Verify sitter documents
- Moderate content and resolve disputes
- Monitor platform metrics

---

## 🔐 Safety & Verification

We take safety seriously with multi-layered verification:

1. **University Verification** - Institutional email or student document
2. **Government ID** - Verified with selfie matching and liveness detection
3. **Background Check** - Criminal record verification via e-Devlet
4. **Live Location** - Real-time GPS tracking during sessions
5. **In-App Only** - All communication through secure chat
6. **KVKK Compliant** - Turkish data protection standards

---

## 💳 Pricing

- **Platform Fee:** 10% per transaction
- **Sitter Rates:** 450-800 TL/hour (Beşiktaş pilot)
  - Lower end: Homework support
  - Upper end: Language tutoring + strong reviews

### Cancellation Policy

- **>12 hours before:** Full refund
- **12-2 hours before:** 50% charge (sitter protected)
- **<2 hours/no-show:** 100% charge

---

## 📱 Key Features

### For Parents

**Search & Discovery**
- Filter by distance, language, price, and availability
- View verified badges and reviews
- See sitter location on map

**Booking**
- Request specific sitters or post a need
- Set pickup location and requirements
- In-app secure payment

**During Session**
- Live GPS tracking
- In-app chat with sitter
- Session status updates

**After Session**
- Leave reviews
- View session history
- Manage recurring schedules

### For Sitters

**Profile Management**
- Complete verification process
- Set service areas and rates
- Manage availability calendar

**Earning**
- Accept booking requests
- Apply to nearby needs
- Track earnings and payouts

**Session Management**
- Update session status (on my way, picked up, arrived)
- Chat with parents
- Receive ratings and build reputation

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

See `.env.example` for required variables:
- Database connection
- API keys (payment, maps, notifications)
- JWT secrets
- Third-party service credentials

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Complete product requirements
- **[implementation_plan.md](./implementation_plan.md)** - Development roadmap with 20 phases
- **[agent.md](./agent.md)** - Developer context and conventions
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant instructions

---

## 🗺️ Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] User authentication and profiles
- [ ] Sitter verification system
- [ ] Search and booking flow
- [ ] Live location tracking
- [ ] Payment integration

### Phase 2: Safety & Scale (Weeks 5-8)
- [ ] Admin dashboard
- [ ] Reporting system
- [ ] Review system
- [ ] KVKK compliance

### Phase 3: Premium Features (Weeks 9-12)
- [ ] Subscription plans
- [ ] Advanced filters
- [ ] Analytics dashboard
- [ ] Performance optimization

See **[implementation_plan.md](./implementation_plan.md)** for complete roadmap.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 👨‍💻 Development Team

- **Product Owner:** [Name]
- **Tech Lead:** [Name]
- **Developers:** [Names]

---

## 📞 Support

- **Email:** support@kampusabla.com
- **Documentation:** See docs/ folder
- **Issues:** Use GitHub Issues for bug reports

---

## 🌍 Pilot Region

**Istanbul - Beşiktaş**  
Targeting private and international schools with strong expat and Arab family demand for Turkish language practice.

---

**Built with ❤️ for safer, smarter childcare solutions in Turkey**
