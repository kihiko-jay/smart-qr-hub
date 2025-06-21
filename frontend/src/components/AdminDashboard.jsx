const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [qrCodes, setQrCodes] = useState([]);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        const fetchData = async (url, setter) => {
            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await response.json();
                setter(data);
            } catch (error) {
                console.error(`Error fetching ${activeTab}:`, error);
            }
        };

        if (activeTab === 'users') {
            fetchData('http://localhost:5000/api/admin/users', setUsers);
        } else if (activeTab === 'qrCodes') {
            fetchData('http://localhost:5000/api/admin/qrcodes', setQrCodes);
        } else if (activeTab === 'payments') {
            fetchData('http://localhost:5000/api/admin/payments', setPayments);
        }
    }, [activeTab]);

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <h2>Admin Panel</h2>
                <ul>
                    <li className={activeTab === 'users' ? styles.active : ''} onClick={() => setActiveTab('users')}>Users</li>
                    <li className={activeTab === 'qrCodes' ? styles.active : ''} onClick={() => setActiveTab('qrCodes')}>QR Codes</li>
                    <li className={activeTab === 'payments' ? styles.active : ''} onClick={() => setActiveTab('payments')}>Payments</li>
                </ul>
            </aside>
            <main className={styles.content}>
                {activeTab === 'users' && (
                    <div>
                        <h2>Manage Users</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <button>Block</button>
                                            <button>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'qrCodes' && (
                    <div>
                        <h2>QR Code Analytics</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>QR Code</th>
                                    <th>Scans</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qrCodes.map(qr => (
                                    <tr key={qr._id}>
                                        <td>{qr.data}</td>
                                        <td>{qr.scanCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'payments' && (
                    <div>
                        <h2>Payment Transactions</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => (
                                    <tr key={payment._id}>
                                        <td>{payment.user.name} ({payment.user.email})</td>
                                        <td>${payment.amount}</td>
                                        <td>{payment.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
