import type { Dog, NewDogInput } from "./types";

export interface DogRepository {
  getYardDogs(): Promise<Dog[]>;
  getGraduatedDogs(page: number): Promise<{ dogs: Dog[]; hasMore: boolean }>;
  addDog(input: NewDogInput): Promise<Dog>;
  getDogById(id: string): Promise<Dog | null>;
}
