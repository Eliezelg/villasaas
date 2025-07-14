#!/usr/bin/env python3

import json
import sys
from collections import defaultdict

def analyze_test_report(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    summary = data['summary']
    results = data['results']
    
    print(f"=== TEST REPORT SUMMARY ===")
    print(f"Total Tests: {summary['totalTests']}")
    print(f"Successful: {summary['successfulTests']}")
    print(f"Failed: {summary['failedTests']}")
    print(f"Success Rate: {summary['successRate']:.2f}%")
    print()
    
    # Group failures by error type
    failures_by_error = defaultdict(list)
    failures_by_status = defaultdict(list)
    
    for test in results:
        if test['status'] == 'failed':
            endpoint = test['endpoint']
            method = test['method']
            status_code = test.get('statusCode', 'timeout')
            error = test.get('error', test.get('data', {}).get('error', 'Unknown error'))
            
            failures_by_status[status_code].append({
                'endpoint': endpoint,
                'method': method,
                'error': error
            })
            
            # Categorize by error type
            if 'Not Found' in str(error):
                failures_by_error['Not Found (404)'].append(f"{method} {endpoint}")
            elif 'Invalid refresh token' in str(error):
                failures_by_error['Authentication'].append(f"{method} {endpoint}")
            elif 'Image and filename are required' in str(error):
                failures_by_error['Validation'].append(f"{method} {endpoint}")
            elif 'timeout' in str(error):
                failures_by_error['Timeout'].append(f"{method} {endpoint}")
            elif 'FastifyError' in str(error):
                failures_by_error['Server Error'].append(f"{method} {endpoint}")
            elif 'Property not found' in str(error):
                failures_by_error['Business Logic'].append(f"{method} {endpoint}")
            else:
                failures_by_error['Other'].append(f"{method} {endpoint}: {error}")
    
    print("=== FAILURES BY ERROR TYPE ===")
    for error_type, endpoints in sorted(failures_by_error.items()):
        print(f"\n{error_type} ({len(endpoints)} failures):")
        for endpoint in sorted(set(endpoints)):
            print(f"  - {endpoint}")
    
    print("\n=== FAILURES BY STATUS CODE ===")
    for status_code, failures in sorted(failures_by_status.items(), key=lambda x: str(x[0])):
        print(f"\nStatus {status_code} ({len(failures)} failures):")
        unique_endpoints = set(f"{f['method']} {f['endpoint']}" for f in failures)
        for endpoint in sorted(unique_endpoints):
            print(f"  - {endpoint}")
    
    # Identify patterns
    print("\n=== PATTERNS IDENTIFIED ===")
    
    # Check for missing routes
    missing_routes = [f for f in failures_by_error.get('Not Found (404)', [])]
    if missing_routes:
        print(f"\n1. Missing Routes ({len(missing_routes)} endpoints):")
        print("   These endpoints are not registered in the backend")
    
    # Check for validation issues
    validation_issues = failures_by_error.get('Validation', [])
    if validation_issues:
        print(f"\n2. Validation Issues ({len(validation_issues)} endpoints):")
        print("   These endpoints have incorrect request validation")
    
    # Recommendations
    print("\n=== RECOMMENDATIONS TO REACH 80%+ SUCCESS RATE ===")
    print("\nCurrent success rate: {:.2f}%".format(summary['successRate']))
    print("Need to fix at least {} more tests to reach 80%".format(
        int(summary['totalTests'] * 0.8) - summary['successfulTests']
    ))
    
    print("\nPriority fixes (in order):")
    print("\n1. Fix 404 Not Found errors (12 endpoints) - These are missing route registrations")
    print("   - Analytics routes (/api/analytics/*)")
    print("   - Messaging routes (/api/messaging/*)")
    print("   - Payment routes (/api/payments/*)")
    print("   - Pricing periods route (/api/properties/*/pricing-periods)")
    print("   - Promo codes route (/api/promo-codes)")
    
    print("\n2. Fix validation errors (3 endpoints)")
    print("   - Image upload validation")
    print("   - Booking options validation")
    print("   - Public pricing calculation")
    
    print("\n3. Fix business logic errors (2 endpoints)")
    print("   - Property search by city")
    print("   - Public property retrieval")
    
    print("\n4. Fix timeout issue (1 endpoint)")
    print("   - Messaging conversations creation")
    
    print("\nEstimated impact: Fixing these would bring success rate to ~84%")

if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else "final-test-report-1752100046863.json"
    analyze_test_report(file_path)