-- Ensure Dummy Farmer Exists for testing foreign keys
INSERT INTO farmers (farmer_id, phone_number, full_name, district, preferred_language)
VALUES ('11111111-1111-1111-1111-111111111111', '+910000000003', 'Mock Farmer', 'Bengaluru Urban', 'en')
ON CONFLICT (farmer_id) DO UPDATE SET village = NULL;

-- Insert Mock Fruits data into the Live Database with 400x400 placeholder images from Unsplash
INSERT INTO marketplace_listings (
  farmer_id, commodity_name, commodity_name_kn, quantity_kg, quantity_remaining_kg, 
  minimum_price_per_kg, fair_price_estimate, msp_at_listing, grade, delivery_terms, 
  status, location_district, expires_at, listing_images
) VALUES 
('11111111-1111-1111-1111-111111111111', 'Mango (Alphonso)', 'ಮಾವಿನಹಣ್ಣು (ಅಲ್ಫೋನ್ಸೊ)', 500, 500, 90, 85, 85, 'A', 'farm_pickup', 'active', 'Belagavi', NOW() + INTERVAL '5 days', '{"https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400&h=400&auto=format&fit=crop"}'),
('11111111-1111-1111-1111-111111111111', 'Mango (Totapuri)', 'ಮಾವಿನಹಣ್ಣು (ತೋತಾಪುರಿ)', 1200, 1200, 40, 45, 45, 'B', 'buyer_logistics', 'active', 'Kolar', NOW() + INTERVAL '3 days', '{"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=400&h=400&auto=format&fit=crop"}'),
('11111111-1111-1111-1111-111111111111', 'Banana (Robusta)', 'ಬಾಳೆಹಣ್ಣು (ರೋಬಸ್ಟಾ)', 2000, 2000, 22, 25, 25, 'A', 'nearest_mandi', 'active', 'Chitradurga', NOW() + INTERVAL '2 days', '{"https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?q=80&w=400&h=400&auto=format&fit=crop"}'),
('11111111-1111-1111-1111-111111111111', 'Papaya', 'ಪರಂಗಿಹಣ್ಣು', 350, 350, 35, 30, 30, 'A', 'farm_pickup', 'active', 'Mandya', NOW() + INTERVAL '4 days', '{"https://images.unsplash.com/photo-1517282009859-f000eca28143?q=80&w=400&h=400&auto=format&fit=crop"}'),
('11111111-1111-1111-1111-111111111111', 'Watermelon', 'ಕಲ್ಲಂಗಡಿ', 5000, 5000, 12, 15, 15, 'C', 'buyer_logistics', 'active', 'Raichur', NOW() + INTERVAL '7 days', '{"https://images.unsplash.com/photo-1587049352847-ec5a1cffb637?q=80&w=400&h=400&auto=format&fit=crop"}'),
('11111111-1111-1111-1111-111111111111', 'Pomegranate (Bhagwa)', 'ದಾಳಿಂಬೆ (ಭಗವಾ)', 800, 800, 130, 120, 120, 'A', 'nearest_mandi', 'active', 'Tumakuru', NOW() + INTERVAL '6 days', '{"https://images.unsplash.com/photo-1615486171448-4fdceda95bf5?q=80&w=400&h=400&auto=format&fit=crop"}');
