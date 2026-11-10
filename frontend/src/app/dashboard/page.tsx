export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-10">
        Your listed skills, active leases, and earnings.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400">Skills listed</div>
          <div className="text-3xl font-bold mt-1">0</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400">Active leases</div>
          <div className="text-3xl font-bold mt-1">0</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400">Earnings (NEAR)</div>
          <div className="text-3xl font-bold mt-1 text-verteus-500">0.00</div>
        </div>
      </div>

      <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center text-gray-500">
        Connect a NEAR wallet to see your skills and leases.
        <br />
        <span className="text-sm">(Wallet selector integration next)</span>
      </div>
    </div>
  );
}
