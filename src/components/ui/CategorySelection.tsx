"use client";

import { Category } from "@/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaBasketballBall,
  FaCheck,
  FaFilm,
  FaGlassCheers,
  FaMusic,
  FaQuestion,
  FaSpinner,
  FaTheaterMasks,
} from "react-icons/fa";

interface CategorySelectionProps {
  onComplete: (selectedCategories: string[]) => void;
  initialSelectedCategories?: string[];
  maxSelections?: number;
}

// Define a type for the API response
interface CategoryResponse {
  segment: {
    id: string;
    name: string;
  };
  genres?: Array<{
    id: string;
    name: string;
  }>;
}

// Function to get the icon based on category name
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();

  if (name.includes("miscellaneous"))
    return <FaGlassCheers className="h-6 w-6" />;

  if (name.includes("music")) return <FaMusic className="h-6 w-6" />;
  if (name.includes("sport")) return <FaBasketballBall className="h-6 w-6" />;
  if (
    name.includes("art") ||
    name.includes("theatre") ||
    name.includes("theater")
  )
    return <FaTheaterMasks className="h-6 w-6" />;
  if (name.includes("film") || name.includes("movie"))
    return <FaFilm className="h-6 w-6" />;

  // Default icon for other categories
  return <FaQuestion className="h-6 w-6" />;
};

export default function CategorySelection({
  onComplete,
  initialSelectedCategories = [],
  maxSelections = 5,
}: CategorySelectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialSelectedCategories
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();

        // Process categories to ensure they have proper format with unique IDs
        const processedCategories = Array.isArray(data.categories)
          ? data.categories
              .filter(
                (cat: CategoryResponse) =>
                  cat && cat.segment && cat.segment.id && cat.segment.name
              )
              .map((cat: CategoryResponse) => ({
                id: cat.segment.id,
                name: cat.segment.name,
              }))
          : [];

        // Remove duplicates by id
        const uniqueCategories = Array.from(
          new Map(processedCategories.map((item: Category) => [item.id, item]))
        ).map(([, item]) => item) as Category[];

        setCategories(uniqueCategories);
      } catch (err) {
        setError("Failed to load categories. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prevSelected) => {
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter((id) => id !== categoryId);
      } else {
        if (prevSelected.length >= maxSelections) {
          return prevSelected;
        }
        return [...prevSelected, categoryId];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedCategoryIds.length > 0) {
      onComplete(selectedCategoryIds);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Choose your interests
        </h2>
        <p className="text-gray-600 mt-2">
          Select up to {maxSelections} categories that interest you
        </p>
        {selectedCategoryIds.length > 0 && (
          <p className="mt-2 text-sm text-primary-600">
            {selectedCategoryIds.length} of {maxSelections} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          const isSelected = selectedCategoryIds.includes(category.id);
          return (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleCategory(category.id)}
              className={`relative p-4 rounded-lg border-2 transition-colors flex flex-col items-center text-center ${
                isSelected
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                  <FaCheck size={10} />
                </div>
              )}
              <div className="mb-3 text-current">
                {getCategoryIcon(category.name)}
              </div>
              <span className="font-medium">{category.name}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={selectedCategoryIds.length === 0}
          className={`px-6 py-2 rounded-md transition-colors ${
            selectedCategoryIds.length > 0
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
