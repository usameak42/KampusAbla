/**
 * Parent Registration - Main Page
 * Multi-step registration process for parents
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ParentStep1 } from "@/components/registration/parent/ParentStep1";
import { ParentStep2 } from "@/components/registration/parent/ParentStep2";
import { ParentStep3 } from "@/components/registration/parent/ParentStep3";

export interface ParentFormData {
    phone: string;
    email: string;
    password: string;
    fullName: string;
    profilePhotoUrl?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
}

export default function ParentRegistration() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<ParentFormData>>({});

    const updateFormData = (data: Partial<ParentFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const progress = (currentStep / 3) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="mx-auto max-w-2xl py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Veli Kaydı</h1>
                    <p className="text-gray-600">Adım {currentStep} / 3</p>
                </div>

                <Progress value={progress} className="mb-6" />

                <Card className="p-6">
                    {currentStep === 1 && (
                        <ParentStep1
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={nextStep}
                            onBack={() => navigate("/register")}
                        />
                    )}
                    {currentStep === 2 && (
                        <ParentStep2
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 3 && (
                        <ParentStep3
                            formData={formData}
                            onFinish={() => navigate("/")}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}
