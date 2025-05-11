import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SafeService } from './services/mysafe.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; 

// Define the interface for Safe details
export interface SafeDetails {
  address: string;
  balance: string;
  owners: string[];
  threshold: number;
  lastPendingTxsDescription?: string; // e.g., "1 (Waiting for Bob)"
  pendingTxs?: number; // Raw count
  modulesDescription?: string; // e.g., "1 (Daily Limit)"
  modules?: string[]; // Raw count
  guard: string | null;
  createdBy: string;
  createdDate: string; // e.g., "2023-11-01"
}

@Component({
  selector: 'app-root',
  standalone: true, // Add standalone: true
  imports: [RouterOutlet, FormsModule, CommonModule], // Add FormsModule and CommonModule to imports
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'Gnosis Pay Auto Recharge Demo';
  safeDeployed: boolean = false;
  safeAddress: string | null = null;
  safeStatus: string = 'loading'; // Initial status: loading, ready, offline, error_fetching_details
  safeDetails: SafeDetails | null = null;
  transactionToAddress: string = '0x9715D8CF39Dfdc4A5BF8052F765A1b3f28fEd034';
  transactionValue: string = '0'; // Default to 0, will be treated as wei
  transactionData: string = '0x';

  constructor(private safeService: SafeService) {
    // Initialize the app
  }

  get isBalanceBelowThreshold(): boolean {
    if (this.safeDetails && this.safeDetails.balance) {
      // Assuming balance is like "123.45 XDAI" or just "123.45"
      const balanceValue = parseFloat(this.safeDetails.balance.split(' ')[0]);
      return !isNaN(balanceValue) && balanceValue < 10;
    }
    return false;
  }

  async ngOnInit() {
    this.safeStatus = 'loading';
    try {
      // This should establish the safeAddress if deployed or deploy if necessary
      this.safeAddress = await this.safeService.deploysafe();
      if (this.safeAddress) {
        this.safeDeployed = true;
        this.safeStatus = 'ready';
        // Now that address is known (or safe deployed), fetch full details
        await this.refreshSafeStatus();
      } else {
        // If deploysafe() returns null and doesn't throw, implies not deployed or no address found
        this.safeStatus = 'offline';
        console.warn('Safe not deployed or address not found during init.');
      }
    } catch (error) {
      console.error('Error during app initialization (deploysafe):', error);
      this.safeStatus = 'offline';
    }
  }

  async sendTransaction(autoRecharge: boolean) {
    if (!this.transactionToAddress || !this.transactionValue) {
      console.error('To Address and Value are required for a transaction.');
      alert('Please fill in "To Address" and "Value"');
      return;
    }
    try {
      // Log the autoRecharge parameter for debugging
      console.log(`Sending transaction with autoRecharge: ${autoRecharge}`);

      await this.safeService.sendTransaction(
        [
          {
            to: this.transactionToAddress,
            value: this.transactionValue,
            data: this.transactionData as `0x${string}` || '0x',
          },
        ],
        autoRecharge // Pass the new parameter to the service
      );
      console.log('Transaction sent successfully from AppComponent');
      alert('Transaction sent!');
    } catch (error) {
      console.error('Error sending transaction from AppComponent:', error);
      alert('Error sending transaction. Check console for details.');
    }
  }

  // Helper to refresh status, e.g., called by a button
  async refreshSafeStatus() {
    this.safeStatus = 'loading_details'; // Indicate we are fetching details
    try {
      // The safeAddress should have been set by ngOnInit via deploysafe()
      // If it's not set here, it means the Safe is not deployed or address is unknown.
      if (!this.safeAddress) {
        console.log('Safe address not available, cannot fetch stats.');
        this.safeStatus = 'offline';
        this.safeDeployed = false;
        this.safeDetails = null;
        return;
      }
      const details: SafeDetails = await this.safeService.stats();

      if (details) {
        this.safeDetails = details;
        this.safeAddress = details.address; // Ensure address is consistent with details
        this.safeDeployed = true;
        this.safeStatus = 'ready';
      } else {
        // This case might indicate an issue if stats() returns null instead of throwing for "not found"
        console.warn('Received null details from safeService.stats() for address:', this.safeAddress);
        this.safeDetails = null;
        this.safeDeployed = true; // Still deployed, but details are missing
        this.safeStatus = 'error_fetching_details';
      }
      //console.log('Refreshed Safe Status. Status:', this.safeStatus, 'Address:', this.safeAddress, 'Details:', !!this.safeDetails);
    } catch (error) {
      console.error('Error refreshing safe status:', error);
      this.safeDetails = null;
      // If an error occurs, determine if it's 'offline' or 'error_fetching_details'
      this.safeStatus = this.safeAddress ? 'error_fetching_details' : 'offline';
      this.safeDeployed = !!this.safeAddress; // Keep deployed true if address was known
      if (!this.safeAddress) { // If address was never known or lost
        this.safeDeployed = false;
        this.safeStatus = 'offline';
      }
    }
  }
}
