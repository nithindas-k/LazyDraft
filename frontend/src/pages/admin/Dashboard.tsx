import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

const AdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4">
            <h2 className="text-3xl font-bold">Admin Analytics</h2>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Emails</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">1,284</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Parsing Success</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-green-600">98.2%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-blue-600">42</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
