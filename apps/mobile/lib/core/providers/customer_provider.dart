import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/customer.dart';
import '../repositories/local_customer_repository.dart';
import 'sync_provider.dart';

import 'auth_provider.dart';

final localCustomerRepoProvider = Provider<LocalCustomerRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return LocalCustomerRepository(db);
});

const defaultInitialCustomers = <Customer>[];

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
  final String? activeTenantId;

  CustomerNotifier(this._repo, [this.activeTenantId])
      : super(const CustomerState(allCustomers: defaultInitialCustomers, isLoading: false)) {
    _init();
  }

  Future<void> _init() async {
    try {
      await _repo.purgeMockCustomersIfPresent();
      final customers = await _repo.getAllCustomers(tenantId: activeTenantId);
      if (!mounted) return;
      if (customers.isNotEmpty) {
        state = state.copyWith(allCustomers: customers, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (_) {
      if (mounted) {
        state = state.copyWith(isLoading: false);
      }
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
      tenantId: activeTenantId ?? 'tenant-1',
    );
    final customers = await _repo.getAllCustomers(tenantId: activeTenantId);
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
    final customers = await _repo.getAllCustomers(tenantId: activeTenantId);
    state = state.copyWith(allCustomers: customers);
    return remaining;
  }

  Future<void> reload([String? tenantId]) async {
    final tid = tenantId ?? activeTenantId;
    final customers = await _repo.getAllCustomers(tenantId: tid);
    state = state.copyWith(allCustomers: customers);
  }
}

final customerProvider = StateNotifierProvider<CustomerNotifier, CustomerState>((ref) {
  final repo = ref.watch(localCustomerRepoProvider);
  final authState = ref.watch(authProvider);
  final tenantId = authState.activeMembership?.tenantId;
  return CustomerNotifier(repo, tenantId);
});
