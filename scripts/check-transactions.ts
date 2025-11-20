import { db } from '../server/db';
import { transactions } from '../shared/schema';

async function checkTransactions() {
  try {
    const allTransactions = await db.select().from(transactions);
    console.log('Total transactions:', allTransactions.length);
    console.log('\nTransactions:');
    allTransactions.forEach(t => {
      console.log(`- ${t.createdAt.toISOString().split('T')[0]} | ${t.productName} | Amount: $${t.amount} | Credits: ${t.credits} | Status: ${t.status} | User: ${t.userId}`);
    });

    const totalRevenue = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalSales = allTransactions.length;
    console.log(`\nTotal Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`Total Sales: ${totalSales}`);
    console.log(`Average Order Value: $${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}`);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkTransactions();
