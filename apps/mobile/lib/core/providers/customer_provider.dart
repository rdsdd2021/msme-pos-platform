import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/customer.dart';
import '../repositories/local_customer_repository.dart';
import 'sync_provider.dart';

final localCustomerRepoProvider = Provider<LocalCustomerRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return LocalCustomerRepository(db);
});

const defaultInitialCustomers = <Customer>[
  Customer(
    id: 'c-1',
    name: 'Ramesh Sharma',
    phone: '+919876543210',
    creditLimitPaisa: 500000,
    currentBalancePaisa: 125000,
  ),
  Customer(
    id: 'c-2',
    name: 'Pooja Verma',
    phone: '+919876543211',
    creditLimitPaisa: 300000,
    currentBalancePaisa: 42000,
  ),
  Customer(
    id: 'c-3',
    name: 'Suresh Patel',
    phone: '+919876543212',
    creditLimitPaisa: 1000000,
    currentBalancePaisa: 0,
  ),
];

class CustomerState {
  final List<Customer> allCustomers;
  final String searchQuery;
  final bool isLoading;

  const CustomerState({
    this.allCustomers = defaultInitialCustomers,
    this.searchQuery = '',
    this.isLoading = false,
  });

  List<Customer> get filteredCustomers {
    final q = searchQuery.toLowerCase().trim();
    if (q.isEmpty) return allCustomers;
    return allCustomers.where((c) {
      return c.name.toLowerCase().contains(q) || c.phone.contains(q);
    }).toList();
  }

  CustomerState copyWith({
    List<Customer>? allCustomers,
    String? searchQuery,
    bool? isLoading,
  }) {
    return CustomerState(
      allCustomers: allCustomers ?? this.allCustomers,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class CustomerNotifier extends StateNotifier<CustomerState> {
  final LocalCustomerRepository _repo;

  CustomerNotifier(this._repo)
      : super(const CustomerState(allCustomers: defaultInitialCustomers, isLoading: false)) {
    _init();
  }

  Future<void> _init() async {
    try {
      // Ensure initial baseline seeds exist
      await _repo.seedInitialCustomersIfEmpty();
      final customers = await _repo.getAllCustomers();
      if (customers.isNotEmpty) {
        state = state.copyWith(allCustomers: customers, isLoading: false);
      }
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  void updateSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  Future<Customer> addCustomer({
    required String name,
    required String phone,
    int creditLimitPaisa = 500000,
  }) async {
    final newCust = await _repo.createCustomer(
      name: name,
      phone: phone,
      creditLimitPaisa: creditLimitPaisa,
    );
    final customers = await _repo.getAllCustomers();
    state = state.copyWith(allCustomers: customers);
    return newCust;
  }

  Future<int> recordRepayment({
    required String customerId,
    required int amountPaisa,
    required String paymentMethod,
  }) async {
    final remaining = await _repo.recordRepayment(
      customerId: customerId,
      amountPaisa: amountPaisa,
      paymentMethod: paymentMethod,
    );
    final customers = await _repo.getAllCustomers();
    state = state.copyWith(allCustomers: customers);
    return remaining;
  }

  Future<void> reload() async {
    final customers = await _repo.getAllCustomers();
    if (customers.isNotEmpty) {
      state = state.copyWith(allCustomers: customers);
    }
  }
}

final customerProvider = StateNotifierProvider<CustomerNotifier, CustomerState>((ref) {
  final repo = ref.watch(localCustomerRepoProvider);
  return CustomerNotifier(repo);
});
