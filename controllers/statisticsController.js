const User = require('../models/userModel');
const Client = require('../models/clientModel');
const SubscriptionPlan = require('../models/subscriptionModel');
const Session = require('../models/sessionModel');

// Get comprehensive statistics for super-admin
exports.getStatistics = async (req, res) => {
  try {
    // Get all users with their roles
    const users = await User.find({}).select('role salary');

    // Get all clients
    const clients = await Client.find({}).populate(
      'subscription.plan privatePlan.plan'
    );

    // Get all subscription plans
    const subscriptionPlans = await SubscriptionPlan.find({});

    // Get all sessions
    const sessions = await Session.find({});

    // Calculate user statistics
    const userStats = {
      totalUsers: users.length,
      superAdmins: users.filter((user) => user.role === 'super-admin').length,
      admins: users.filter((user) => user.role === 'admin').length,
      coaches: users.filter((user) => user.role === 'coach').length,
    };

    // Calculate total salaries (only for coaches)
    const totalSalaries = users
      .filter((user) => user.role === 'coach' && user.salary)
      .reduce((sum, user) => sum + user.salary, 0);

    // Calculate client statistics
    const clientStats = {
      totalClients: clients.length,
      clientsWithPrivatePlans: clients.filter(
        (client) => client.privatePlan && client.privatePlan.plan
      ).length,
    };

    // Calculate subscription plan statistics
    const subscriptionStats = {
      totalPlans: subscriptionPlans.length,
      mainPlans: subscriptionPlans.filter((plan) => plan.type === 'main')
        .length,
      privatePlans: subscriptionPlans.filter((plan) => plan.type === 'private')
        .length,
    };

    // Calculate income from main subscriptions
    const mainSubscriptionIncome = clients.reduce((total, client) => {
      if (client.subscription && client.subscription.priceAtPurchase) {
        return total + client.subscription.priceAtPurchase;
      }
      return total;
    }, 0);

    // Calculate income from private subscriptions
    const privateSubscriptionIncome = clients.reduce((total, client) => {
      if (client.privatePlan && client.privatePlan.priceAtPurchase) {
        return total + client.privatePlan.priceAtPurchase;
      }
      return total;
    }, 0);

    // Calculate total income
    const totalIncome = mainSubscriptionIncome + privateSubscriptionIncome;

    // Calculate session statistics
    const sessionStats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(
        (session) => session.status === 'completed'
      ).length,
      pendingSessions: sessions.filter(
        (session) => session.status === 'pending'
      ).length,
      canceledSessions: sessions.filter(
        (session) => session.status === 'canceled'
      ).length,
    };

    // Calculate average salary per coach
    const coachesWithSalary = users.filter(
      (user) => user.role === 'coach' && user.salary
    );
    const averageSalary =
      coachesWithSalary.length > 0
        ? totalSalaries / coachesWithSalary.length
        : 0;

    // Calculate average income per client
    const averageIncomePerClient =
      clients.length > 0 ? totalIncome / clients.length : 0;

    // Calculate subscription plan usage
    const planUsage = {};
    subscriptionPlans.forEach((plan) => {
      const usage = clients.filter(
        (client) =>
          (client.subscription &&
            client.subscription.plan &&
            client.subscription.plan._id.toString() === plan._id.toString()) ||
          (client.privatePlan &&
            client.privatePlan.plan &&
            client.privatePlan.plan._id.toString() === plan._id.toString())
      ).length;

      planUsage[plan.name] = {
        planType: plan.type,
        price: plan.price,
        usage: usage,
        revenue: usage * plan.price,
      };
    });

    // Calculate monthly statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClients = clients.filter(
      (client) => client.createdAt >= thirtyDaysAgo
    );
    const recentSessions = sessions.filter(
      (session) => session.createdAt >= thirtyDaysAgo
    );

    // Calculate coach performance (sessions per coach)
    const coachPerformance = {};
    users
      .filter((user) => user.role === 'coach')
      .forEach((coach) => {
        const coachSessions = sessions.filter(
          (session) =>
            session.coach && session.coach.toString() === coach._id.toString()
        );

        coachPerformance[coach.name] = {
          totalSessions: coachSessions.length,
          completedSessions: coachSessions.filter(
            (s) => s.status === 'completed'
          ).length,
          pendingSessions: coachSessions.filter((s) => s.status === 'pending')
            .length,
          canceledSessions: coachSessions.filter((s) => s.status === 'canceled')
            .length,
          completionRate:
            coachSessions.length > 0
              ? (coachSessions.filter((s) => s.status === 'completed').length /
                  coachSessions.length) *
                100
              : 0,
        };
      });

    // Compile comprehensive statistics
    const statistics = {
      overview: {
        totalUsers: userStats.totalUsers,
        totalClients: clientStats.totalClients,
        totalIncome: totalIncome,
        totalSalaries: totalSalaries,
        netProfit: totalIncome - totalSalaries,
      },
      userBreakdown: {
        superAdmins: userStats.superAdmins,
        admins: userStats.admins,
        coaches: userStats.coaches,
        totalStaff: userStats.admins + userStats.coaches,
      },
      financial: {
        totalIncome: totalIncome,
        mainSubscriptionIncome: mainSubscriptionIncome,
        privateSubscriptionIncome: privateSubscriptionIncome,
        totalSalaries: totalSalaries,
        averageSalary: Math.round(averageSalary),
        netProfit: totalIncome - totalSalaries,
        averageIncomePerClient: Math.round(averageIncomePerClient),
      },
      subscriptions: {
        totalPlans: subscriptionStats.totalPlans,
        mainPlans: subscriptionStats.mainPlans,
        privatePlans: subscriptionStats.privatePlans,
        clientsWithPrivatePlans: clientStats.clientsWithPrivatePlans,
        planUsage: planUsage,
      },
      sessions: {
        totalSessions: sessionStats.totalSessions,
        completedSessions: sessionStats.completedSessions,
        pendingSessions: sessionStats.pendingSessions,
        canceledSessions: sessionStats.canceledSessions,
        completionRate:
          sessionStats.totalSessions > 0
            ? Math.round(
                (sessionStats.completedSessions / sessionStats.totalSessions) *
                  100
              )
            : 0,
      },
      performance: {
        coachPerformance: coachPerformance,
        recentActivity: {
          newClientsLast30Days: recentClients.length,
          newSessionsLast30Days: recentSessions.length,
        },
      },
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json({
      status: 'success',
      data: {
        statistics,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

// Get simplified statistics for quick overview
exports.getQuickStats = async (req, res) => {
  try {
    const [userCount, clientCount, totalIncome, totalSalaries] =
      await Promise.all([
        User.countDocuments(),
        Client.countDocuments(),
        Client.aggregate([
          {
            $group: {
              _id: null,
              mainIncome: { $sum: '$subscription.priceAtPurchase' },
              privateIncome: { $sum: '$privatePlan.priceAtPurchase' },
            },
          },
        ]),
        User.aggregate([
          { $match: { role: 'coach', salary: { $exists: true } } },
          { $group: { _id: null, total: { $sum: '$salary' } } },
        ]),
      ]);

    const income = totalIncome[0] || { mainIncome: 0, privateIncome: 0 };
    const salaries = totalSalaries[0] || { total: 0 };
    const totalRevenue = (income.mainIncome || 0) + (income.privateIncome || 0);

    res.status(200).json({
      status: 'success',
      data: {
        quickStats: {
          totalUsers: userCount,
          totalClients: clientCount,
          totalRevenue: totalRevenue,
          totalSalaries: salaries.total,
          netProfit: totalRevenue - salaries.total,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching quick statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch quick statistics',
      error: error.message,
    });
  }
};

