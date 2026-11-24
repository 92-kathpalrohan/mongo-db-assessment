import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
class Coordinates {
    @Prop({ type: String, enum: ['Point'], default: 'Point' })
    type: string;

    @Prop({ type: [Number] })
    coordinates: [number, number]; // [longitude, latitude] in this order
}

@Schema({ _id: false })
class Location {
    @Prop({ type: String })
    address: string;

    @Prop({ type: String })
    locality: string;

    @Prop({ type: String })
    city: string;

    @Prop({ type: String })
    country: string;

    @Prop({ type: Coordinates })
    coordinates?: Coordinates;
}

@Schema({ _id: false })
class Pricing {
    @Prop({ type: Number })
    averageCostForTwo: number;

    @Prop({ type: String })
    currency: string;

    @Prop({ type: String })
    priceRange?: string;
}

@Schema({ _id: false })
class Ratings {
    @Prop({ type: Number })
    averageRating?: number;

    @Prop({ type: Number })
    totalVotes: number;
}

@Schema({ _id: false })
class Capabilities {
    @Prop({ type: Boolean, default: false })
    isDeliveringNow: boolean;

    @Prop({ type: Boolean, default: false })
    isTableBookingAvailable: boolean;

    @Prop({ type: Boolean, default: false })
    isOnlineDeliveryAvailable: boolean;

    @Prop({ type: Boolean, default: false })
    switchToOrderAhead: boolean;
}

@Schema({ timestamps: true, collection: 'restaurants' })
export class Restaurant {
    // Source reference from the Zomato dataset. Absent for restaurants
    // created through the API.
    @Prop({ type: String })
    zomatoRestaurantId?: string;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: [String], default: [] })
    cuisines: string[];

    @Prop({ type: Location })
    location: Location;

    @Prop({ type: Capabilities })
    capabilities: Capabilities;

    @Prop({ type: Pricing })
    pricing: Pricing;

    @Prop({ type: Ratings })
    ratings: Ratings;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Unique only among restaurants that have a Zomato ID; missing or null
// values are left out of the index.
RestaurantSchema.index(
    { zomatoRestaurantId: 1 },
    {
        unique: true,
        partialFilterExpression: { zomatoRestaurantId: { $type: 'string' } },
    },
);
