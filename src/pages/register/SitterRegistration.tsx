/**
 * Sitter Registration - Main Page
 * Multi-step registration process for sitters (5 steps)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SitterStep1 } from "@/components/registration/sitter/SitterStep1";
import { SitterStep2 } from "@/components/registration/sitter/SitterStep2";
import { SitterStep3 } from "@/components/registration/sitter/SitterStep3";
import { SitterStep4 } from "@/components/registration/sitter/SitterStep4";
import { SitterStep5 } from "@/components/registration/sitter/SitterStep5";

export interface SitterFormData {
    phone: string;
    email: string;
    password: string;
    universityEmail: string;
    fullName: string;
    university: string;
    customUniversity?: string;
    department: string;
    year: number;
    languages: string[];
    bio?: string;
    hourlyRate: number;
    serviceArea?: {
        latitude: number;
        longitude: number;
        radius: number;
    };
    profilePhotoUrl?: string;
    introVideoUrl?: string;
}

export default function SitterRegistration() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<SitterFormData>>({
        hourlyRate: 450,
        languages: ["Turkish"],
        year: 1,
    });

    const updateFormData = (data: Partial<SitterFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const progress = (currentStep / 5) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="mx-auto max-w-2xl py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bakıcı Kaydı</h1>
                    <p className="text-gray-600">Adım {currentStep} / 5</p>
                </div>

                <Progress value={progress} className="mb-6" />

                <Card className="p-6">
                    {currentStep === 1 && (
                        <SitterStep1
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={nextStep}
                            onBack={() => navigate("/register")}
                        />
                    )}
                    {currentStep === 2 && (
                        <SitterStep2
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 3 && (
                        <SitterStep3
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 4 && (
                        <SitterStep4
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}
                    {currentStep === 5 && (
                        <SitterStep5
                            formData={formData}
                            onFinish={() => navigate("/")}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}
